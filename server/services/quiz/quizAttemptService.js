const Quiz = require('../../models/Quiz');
const Question = require('../../models/Question');
const QuizAttempt = require('../../models/QuizAttempt');
const AppError = require('../../utils/AppError');
const { gradeAnswers, buildDetailedResult } = require('./gradingUtils');

async function getQuizForAttempt(studentUser, quizId) {
  const quiz = await Quiz.findOne({ _id: quizId, student: studentUser._id }).populate('questions');
  if (!quiz) {
    throw new AppError('Quiz not found.', 404, 'QUIZ_NOT_FOUND');
  }

  const existingAttempt = await QuizAttempt.findOne({ quiz: quiz._id }).lean();
  if (existingAttempt) {
    throw new AppError('You have already attempted this quiz. Generate a new one to practice again.', 409, 'ALREADY_ATTEMPTED');
  }

  return {
    _id: quiz._id,
    totalQuestions: quiz.totalQuestions,
    questions: quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
    })),
  };
}

async function submitAttempt(studentUser, quizId, submittedAnswers) {
  const quiz = await Quiz.findOne({ _id: quizId, student: studentUser._id }).populate('questions');
  if (!quiz) {
    throw new AppError('Quiz not found.', 404, 'QUIZ_NOT_FOUND');
  }

  const existingAttempt = await QuizAttempt.findOne({ quiz: quiz._id }).lean();
  if (existingAttempt) {
    throw new AppError('This quiz has already been submitted.', 409, 'ALREADY_ATTEMPTED');
  }

  const { gradedAnswers, score, percentage } = gradeAnswers(quiz.questions, submittedAnswers);

  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    student: studentUser._id,
    answers: gradedAnswers,
    score,
    totalQuestions: quiz.totalQuestions,
    percentage,
  });

  return buildDetailedResult(attempt, quiz.questions);
}

async function getAttemptDetail(studentUser, attemptId) {
  const attempt = await QuizAttempt.findOne({ _id: attemptId, student: studentUser._id }).populate({
    path: 'quiz',
    populate: [{ path: 'subject', select: 'name' }, { path: 'chapter', select: 'name' }],
  });

  if (!attempt) {
    throw new AppError('Quiz result not found.', 404, 'ATTEMPT_NOT_FOUND');
  }

  const questions = await Question.find({ _id: { $in: attempt.answers.map((a) => a.question) } }).lean();
  const detailed = buildDetailedResult(attempt, questions);

  return {
    ...detailed,
    subject: attempt.quiz.subject,
    chapter: attempt.quiz.chapter,
  };
}

const MAX_ATTEMPTS_RETURNED = 100;

async function listAttemptsForStudent(studentUser) {
  const attempts = await QuizAttempt.find({ student: studentUser._id })
    .populate({
      path: 'quiz',
      populate: [{ path: 'subject', select: 'name' }, { path: 'chapter', select: 'name' }],
    })
    .sort({ submittedAt: -1 })
    .limit(MAX_ATTEMPTS_RETURNED)
    .lean();

  return attempts.map((a) => ({
    _id: a._id,
    score: a.score,
    totalQuestions: a.totalQuestions,
    percentage: a.percentage,
    submittedAt: a.submittedAt,
    subject: a.quiz?.subject,
    chapter: a.quiz?.chapter,
  }));
}

module.exports = { getQuizForAttempt, submitAttempt, getAttemptDetail, listAttemptsForStudent };
