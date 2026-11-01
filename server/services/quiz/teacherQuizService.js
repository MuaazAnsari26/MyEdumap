const Subject = require('../../models/Subject');
const Chapter = require('../../models/Chapter');
const Question = require('../../models/Question');
const TeacherQuiz = require('../../models/TeacherQuiz');
const AppError = require('../../utils/AppError');
const { generateQuestionSet, tryGenerateFromAI } = require('./questionGenerationCore');
const { validateAiQuestion } = require('./questionValidator');

const MAX_QUESTIONS_PER_TEACHER_QUIZ = 30; // per spec section 22

async function resolveSubjectAndChapter(subjectId, chapterId) {
  const subject = await Subject.findById(subjectId).lean();
  if (!subject) {
    throw new AppError('That subject could not be found.', 404, 'SUBJECT_NOT_FOUND');
  }

  let chapter = null;
  if (chapterId) {
    chapter = await Chapter.findOne({ _id: chapterId, subject: subjectId }).lean();
    if (!chapter) {
      throw new AppError('That chapter does not belong to the selected subject.', 400, 'INVALID_CHAPTER');
    }
  }

  return { subject, chapter };
}

// ---------- Mode A: bulk "Generate Quiz" ----------
// Reuses the exact same AI+fallback pipeline as student self-practice
// quizzes (questionGenerationCore) — no duplicated generation logic.
async function generateQuiz(teacherUser, { title, subjectId, chapterId, numberOfQuestions }) {
  const count = Math.min(Math.max(parseInt(numberOfQuestions, 10) || 10, 1), MAX_QUESTIONS_PER_TEACHER_QUIZ);
  const { subject, chapter } = await resolveSubjectAndChapter(subjectId, chapterId);

  const result = await generateQuestionSet({ grade: subject.grade, subject, chapter, count });

  if (result.actualCount === 0) {
    throw new AppError(
      "We couldn't generate questions for this selection right now. Please try again.",
      503,
      'NO_QUESTIONS_AVAILABLE'
    );
  }

  const teacherQuiz = await TeacherQuiz.create({
    teacher: teacherUser._id,
    title: title.trim(),
    grade: subject.grade,
    mode: 'generated',
    subject: subject._id,
    chapter: chapter?._id || null,
    questions: result.questions.map((q) => q._id),
    totalQuestions: result.questions.length,
    generationSource: result.generationSource,
  });

  return {
    teacherQuiz,
    // Teacher gets to see full question content (including answers) to
    // review before assigning — unlike the student-facing quiz endpoints.
    questions: result.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation,
    })),
    requestedCount: result.requestedCount,
    actualCount: result.actualCount,
    usedBroaderFallback: result.usedBroaderFallback,
  };
}

// ---------- Mode B: one-at-a-time "Generate Question" ----------
// Deliberately AI-only, no database fallback: the whole point of custom
// mode is teacher curation of a fresh question, not a silently-reused
// bank question the teacher didn't ask to review. If AI is unavailable,
// that's told to the teacher honestly rather than substituted.
async function generateSingleQuestionPreview(teacherUser, { subjectId, chapterId, topic }) {
  const { subject, chapter } = await resolveSubjectAndChapter(subjectId, chapterId);

  let validated;
  try {
    validated = await tryGenerateFromAI({
      grade: subject.grade,
      subjectName: subject.name,
      chapterName: chapter?.name || topic,
      count: 1,
    });
  } catch (err) {
    throw new AppError('AI is currently unavailable. Please try again.', 503, 'AI_UNAVAILABLE');
  }

  if (validated.length === 0) {
    throw new AppError(
      'AI could not produce a usable question for this selection. Please try again.',
      503,
      'AI_UNAVAILABLE'
    );
  }

  // Not persisted yet — this is just a preview for the teacher to accept,
  // edit, or discard. It only becomes a real Question document if it ends
  // up in the final quiz (see createCustomQuiz).
  return {
    subject: { _id: subject._id, name: subject.name },
    chapter: chapter ? { _id: chapter._id, name: chapter.name } : null,
    topic: chapter?.name || topic || null,
    ...validated[0],
  };
}

// ---------- Mode B: finalize and save the custom quiz ----------
async function createCustomQuiz(teacherUser, { title, grade, questions }) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('Add at least one question before saving the quiz.', 400, 'NO_QUESTIONS');
  }
  if (questions.length > MAX_QUESTIONS_PER_TEACHER_QUIZ) {
    throw new AppError(`A quiz can have at most ${MAX_QUESTIONS_PER_TEACHER_QUIZ} questions.`, 400, 'TOO_MANY_QUESTIONS');
  }

  // Re-validate every question server-side — the client-held "accepted"
  // list is not trusted just because the teacher clicked Accept on it.
  const docsToInsert = [];
  for (const [index, raw] of questions.entries()) {
    const shapeCheck = validateAiQuestion(raw);
    if (!shapeCheck.valid) {
      throw new AppError(`Question ${index + 1} is invalid: ${shapeCheck.reason}.`, 400, 'INVALID_QUESTION');
    }

    const subject = await Subject.findOne({ _id: raw.subjectId, grade }).lean();
    if (!subject) {
      throw new AppError(`Question ${index + 1} has an invalid subject for the selected grade.`, 400, 'INVALID_SUBJECT');
    }

    let chapter = null;
    if (raw.chapterId) {
      chapter = await Chapter.findOne({ _id: raw.chapterId, subject: subject._id }).lean();
      if (!chapter) {
        throw new AppError(`Question ${index + 1} has a chapter that doesn't belong to its subject.`, 400, 'INVALID_CHAPTER');
      }
    }

    docsToInsert.push({
      grade,
      subject: subject._id,
      chapter: chapter?._id || null,
      topic: raw.topic || chapter?.name || null,
      questionText: shapeCheck.question.questionText,
      options: shapeCheck.question.options,
      correctAnswerIndex: shapeCheck.question.correctAnswerIndex,
      explanation: shapeCheck.question.explanation,
      // Teacher-curated: even if AI drafted the initial text, the teacher
      // reviewed and accepted each one individually, so it's attributed
      // to them — distinct from Mode A's bulk 'ai' attribution.
      source: 'teacher',
      createdBy: teacherUser._id,
    });
  }

  const savedQuestions = await Question.insertMany(docsToInsert);

  const teacherQuiz = await TeacherQuiz.create({
    teacher: teacherUser._id,
    title: title.trim(),
    grade,
    mode: 'custom',
    subject: null,
    chapter: null,
    questions: savedQuestions.map((q) => q._id),
    totalQuestions: savedQuestions.length,
    generationSource: 'manual',
  });

  return teacherQuiz;
}

const MAX_QUIZZES_RETURNED = 200;

async function listMyTeacherQuizzes(teacherUser) {
  return TeacherQuiz.find({ teacher: teacherUser._id })
    .populate('subject', 'name')
    .populate('chapter', 'name')
    .sort({ createdAt: -1 })
    .limit(MAX_QUIZZES_RETURNED)
    .lean();
}

module.exports = {
  generateQuiz,
  generateSingleQuestionPreview,
  createCustomQuiz,
  listMyTeacherQuizzes,
  MAX_QUESTIONS_PER_TEACHER_QUIZ,
};
