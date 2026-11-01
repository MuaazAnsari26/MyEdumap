const QuizAssignment = require('../../models/QuizAssignment');
const AssignmentAttempt = require('../../models/AssignmentAttempt');
const Question = require('../../models/Question');
const AppError = require('../../utils/AppError');
const { gradeAnswers, buildDetailedResult } = require('../quiz/gradingUtils');

const MAX_ASSIGNMENTS_RETURNED = 200;

async function listMyAssignments(studentUser) {
  const assignments = await QuizAssignment.find({ student: studentUser._id })
    .populate({
      path: 'teacherQuiz',
      populate: [{ path: 'subject', select: 'name' }, { path: 'chapter', select: 'name' }],
    })
    .populate('teacher', 'name')
    .sort({ createdAt: -1 })
    .limit(MAX_ASSIGNMENTS_RETURNED)
    .lean();

  // Attach score/percentage for completed ones in a single extra query
  // rather than N+1 lookups per assignment.
  const completedIds = assignments.filter((a) => a.status === 'completed').map((a) => a._id);
  const attempts = await AssignmentAttempt.find({ assignment: { $in: completedIds } }).lean();
  const attemptByAssignment = new Map(attempts.map((a) => [String(a.assignment), a]));

  return assignments.map((a) => ({
    _id: a._id,
    status: a.status,
    createdAt: a.createdAt,
    teacher: a.teacher,
    quizTitle: a.teacherQuiz?.title,
    subject: a.teacherQuiz?.subject,
    chapter: a.teacherQuiz?.chapter,
    totalQuestions: a.teacherQuiz?.totalQuestions,
    result: attemptByAssignment.has(String(a._id))
      ? {
          score: attemptByAssignment.get(String(a._id)).score,
          percentage: attemptByAssignment.get(String(a._id)).percentage,
        }
      : null,
  }));
}

async function getAssignmentForAttempt(studentUser, assignmentId) {
  const assignment = await QuizAssignment.findOne({ _id: assignmentId, student: studentUser._id }).populate({
    path: 'teacherQuiz',
    populate: { path: 'questions' },
  });

  if (!assignment) {
    throw new AppError('Assigned quiz not found.', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  if (assignment.status === 'completed') {
    throw new AppError('You have already completed this quiz.', 409, 'ALREADY_ATTEMPTED');
  }

  return {
    _id: assignment._id,
    title: assignment.teacherQuiz.title,
    totalQuestions: assignment.teacherQuiz.totalQuestions,
    questions: assignment.teacherQuiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
    })),
  };
}

async function submitAssignmentAttempt(studentUser, assignmentId, submittedAnswers) {
  const assignment = await QuizAssignment.findOne({ _id: assignmentId, student: studentUser._id }).populate({
    path: 'teacherQuiz',
    populate: { path: 'questions' },
  });

  if (!assignment) {
    throw new AppError('Assigned quiz not found.', 404, 'ASSIGNMENT_NOT_FOUND');
  }
  if (assignment.status === 'completed') {
    throw new AppError('This quiz has already been submitted.', 409, 'ALREADY_ATTEMPTED');
  }

  const questions = assignment.teacherQuiz.questions;
  const { gradedAnswers, score, percentage } = gradeAnswers(questions, submittedAnswers);

  const attempt = await AssignmentAttempt.create({
    assignment: assignment._id,
    student: studentUser._id,
    answers: gradedAnswers,
    score,
    totalQuestions: questions.length,
    percentage,
  });

  assignment.status = 'completed';
  await assignment.save();

  return buildDetailedResult(attempt, questions);
}

async function getAssignmentResult(studentUser, assignmentId) {
  const assignment = await QuizAssignment.findOne({ _id: assignmentId, student: studentUser._id }).populate({
    path: 'teacherQuiz',
    populate: [{ path: 'subject', select: 'name' }, { path: 'chapter', select: 'name' }],
  });
  if (!assignment) {
    throw new AppError('Assigned quiz not found.', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  const attempt = await AssignmentAttempt.findOne({ assignment: assignment._id, student: studentUser._id });
  if (!attempt) {
    throw new AppError('This quiz has not been submitted yet.', 404, 'NOT_YET_ATTEMPTED');
  }

  const questions = await Question.find({ _id: { $in: attempt.answers.map((a) => a.question) } }).lean();
  const detailed = buildDetailedResult(attempt, questions);

  return {
    ...detailed,
    title: assignment.teacherQuiz.title,
    subject: assignment.teacherQuiz.subject,
    chapter: assignment.teacherQuiz.chapter,
  };
}

module.exports = { listMyAssignments, getAssignmentForAttempt, submitAssignmentAttempt, getAssignmentResult };
