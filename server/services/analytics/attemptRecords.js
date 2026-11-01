const QuizAttempt = require('../../models/QuizAttempt');
const AssignmentAttempt = require('../../models/AssignmentAttempt');
const Question = require('../../models/Question');
const Subject = require('../../models/Subject');
const Chapter = require('../../models/Chapter');

// Every completed quiz — whether self-generated practice or
// teacher-assigned — contributes to analytics (spec section 18). This
// pulls both attempt types for the given student IDs, joins in the
// question metadata (subject/chapter/topic) each answer needs, and
// returns one flat, uniform shape so every analytics calculation below
// has a single source of truth instead of two.
async function getAttemptRecordsForStudents(studentIds) {
  const [practiceAttempts, assignmentAttempts] = await Promise.all([
    QuizAttempt.find({ student: { $in: studentIds } }).lean(),
    AssignmentAttempt.find({ student: { $in: studentIds } }).lean(),
  ]);

  const records = [
    ...practiceAttempts.map((a) => ({
      _id: a._id,
      student: a.student,
      score: a.score,
      totalQuestions: a.totalQuestions,
      percentage: a.percentage,
      submittedAt: a.submittedAt,
      answers: a.answers,
    })),
    ...assignmentAttempts.map((a) => ({
      _id: a._id,
      student: a.student,
      score: a.score,
      totalQuestions: a.totalQuestions,
      percentage: a.percentage,
      submittedAt: a.submittedAt,
      answers: a.answers,
    })),
  ];

  if (records.length === 0) {
    return [];
  }

  // Join in question metadata once, in a single query, rather than
  // per-answer lookups.
  const allQuestionIds = [...new Set(records.flatMap((r) => r.answers.map((a) => String(a.question))))];
  const questions = await Question.find({ _id: { $in: allQuestionIds } })
    .select('subject chapter topic')
    .lean();
  const questionById = new Map(questions.map((q) => [String(q._id), q]));

  // Question docs only carry subject/chapter as raw ObjectIds, but every
  // chart label downstream needs the actual name — resolve both in two
  // more single queries rather than N+1 lookups.
  const subjectIds = [...new Set(questions.map((q) => String(q.subject)).filter(Boolean))];
  const chapterIds = [...new Set(questions.map((q) => q.chapter && String(q.chapter)).filter(Boolean))];
  const [subjects, chapters] = await Promise.all([
    Subject.find({ _id: { $in: subjectIds } }).select('name').lean(),
    Chapter.find({ _id: { $in: chapterIds } }).select('name').lean(),
  ]);
  const subjectById = new Map(subjects.map((s) => [String(s._id), s]));
  const chapterById = new Map(chapters.map((c) => [String(c._id), c]));

  return records
    .map((r) => ({
      ...r,
      answers: r.answers.map((a) => {
        const question = questionById.get(String(a.question));
        return {
          ...a,
          subject: question?.subject ? subjectById.get(String(question.subject)) || null : null,
          chapter: question?.chapter ? chapterById.get(String(question.chapter)) || null : null,
          topic: question?.topic || null,
        };
      }),
    }))
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
}

module.exports = { getAttemptRecordsForStudents };
