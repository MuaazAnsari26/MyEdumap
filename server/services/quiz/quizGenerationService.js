const Subject = require('../../models/Subject');
const Chapter = require('../../models/Chapter');
const Quiz = require('../../models/Quiz');
const AppError = require('../../utils/AppError');
const { generateQuestionSet } = require('./questionGenerationCore');

const MAX_QUESTIONS_PER_QUIZ = 15; // reasonable practice-quiz size; teacher-assigned quizzes use a higher cap (see teacherQuizService)

// The single entry point used by the student quiz controller. Delegates
// the actual AI+fallback work to questionGenerationCore (shared with
// teacher bulk generation) and wraps the result in a personal Quiz doc.
async function generateQuiz(studentUser, { subjectId, chapterId, numberOfQuestions }) {
  const count = Math.min(Math.max(parseInt(numberOfQuestions, 10) || 5, 1), MAX_QUESTIONS_PER_QUIZ);

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

  const result = await generateQuestionSet({ grade: subject.grade, subject, chapter, count });

  if (result.actualCount === 0) {
    throw new AppError(
      "We couldn't generate questions for this selection right now. Please try again.",
      503,
      'NO_QUESTIONS_AVAILABLE'
    );
  }

  const quiz = await Quiz.create({
    student: studentUser._id,
    grade: subject.grade,
    subject: subject._id,
    chapter: chapter?._id || null,
    questions: result.questions.map((q) => q._id),
    totalQuestions: result.questions.length,
    generationSource: result.generationSource,
  });

  return {
    quiz,
    // Explicitly strip correctAnswerIndex/explanation/topic here — this is
    // the shape sent to the frontend for taking the quiz. Full question
    // data (with answers) is only ever returned after submission.
    questionsForAttempt: result.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
    })),
    requestedCount: result.requestedCount,
    actualCount: result.actualCount,
    usedBroaderFallback: result.usedBroaderFallback,
  };
}

module.exports = { generateQuiz, MAX_QUESTIONS_PER_QUIZ };
