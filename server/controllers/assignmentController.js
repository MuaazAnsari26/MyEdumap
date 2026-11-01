const asyncHandler = require('../utils/asyncHandler');
const assignmentService = require('../services/assignment/assignmentService');
const assignmentAttemptService = require('../services/assignment/assignmentAttemptService');

// ---------- Teacher ----------
const assignQuiz = asyncHandler(async (req, res) => {
  const result = await assignmentService.assignQuiz(req.user, req.params.teacherQuizId, req.body);

  let message;
  if (result.assignedCount === 0) {
    message = 'Everyone in that selection already had this quiz assigned.';
  } else {
    message = `Quiz assigned to ${result.assignedCount} student(s).`;
  }
  if (result.gradeMismatchedCount > 0) {
    message += ` ${result.gradeMismatchedCount} student(s) were skipped because they're in a different grade.`;
  }

  res.status(201).json({
    success: true,
    message,
    data: result,
  });
});

const listAssignmentsForQuiz = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.listAssignmentsForQuiz(req.user, req.params.teacherQuizId);
  res.status(200).json({ success: true, data: { assignments } });
});

// ---------- Student ----------
const listMyAssignments = asyncHandler(async (req, res) => {
  const assignments = await assignmentAttemptService.listMyAssignments(req.user);
  res.status(200).json({ success: true, data: { assignments } });
});

const getAssignmentForAttempt = asyncHandler(async (req, res) => {
  const assignment = await assignmentAttemptService.getAssignmentForAttempt(req.user, req.params.assignmentId);
  res.status(200).json({ success: true, data: { assignment } });
});

const submitAssignmentAttempt = asyncHandler(async (req, res) => {
  const result = await assignmentAttemptService.submitAssignmentAttempt(req.user, req.params.assignmentId, req.body.answers);
  res.status(201).json({ success: true, message: 'Quiz submitted.', data: { result } });
});

const getAssignmentResult = asyncHandler(async (req, res) => {
  const result = await assignmentAttemptService.getAssignmentResult(req.user, req.params.assignmentId);
  res.status(200).json({ success: true, data: { result } });
});

module.exports = {
  assignQuiz,
  listAssignmentsForQuiz,
  listMyAssignments,
  getAssignmentForAttempt,
  submitAssignmentAttempt,
  getAssignmentResult,
};
