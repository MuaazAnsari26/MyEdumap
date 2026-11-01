const express = require('express');
const router = express.Router();

const assignmentController = require('../controllers/assignmentController');
const { protect, restrictTo, requireVerifiedEmail } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
  assignQuizValidator,
  teacherQuizIdParamValidator,
  assignmentIdValidator,
} = require('../validators/assignmentValidators');

router.use(protect, requireVerifiedEmail);

// Teacher-only
router.post(
  '/teacher-quiz/:teacherQuizId/assign',
  restrictTo('teacher'),
  teacherQuizIdParamValidator,
  assignQuizValidator,
  validateRequest,
  assignmentController.assignQuiz
);
router.get(
  '/teacher-quiz/:teacherQuizId',
  restrictTo('teacher'),
  teacherQuizIdParamValidator,
  validateRequest,
  assignmentController.listAssignmentsForQuiz
);

// Student-only
router.get('/mine', restrictTo('student'), assignmentController.listMyAssignments);
router.get(
  '/:assignmentId/take',
  restrictTo('student'),
  assignmentIdValidator,
  validateRequest,
  assignmentController.getAssignmentForAttempt
);
router.post(
  '/:assignmentId/submit',
  restrictTo('student'),
  assignmentIdValidator,
  validateRequest,
  assignmentController.submitAssignmentAttempt
);
router.get(
  '/:assignmentId/result',
  restrictTo('student'),
  assignmentIdValidator,
  validateRequest,
  assignmentController.getAssignmentResult
);

module.exports = router;
