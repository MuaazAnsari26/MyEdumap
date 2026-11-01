const express = require('express');
const router = express.Router();

const teacherQuizController = require('../controllers/teacherQuizController');
const { protect, restrictTo, requireVerifiedEmail } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiters');
const validateRequest = require('../middleware/validateRequest');
const {
  generateTeacherQuizValidator,
  generateSingleQuestionValidator,
  createCustomQuizValidator,
} = require('../validators/teacherQuizValidators');

router.use(protect, requireVerifiedEmail, restrictTo('teacher'));

router.get('/', teacherQuizController.listMyQuizzes);

// Mode A — bulk generation
router.post('/generate', aiLimiter, generateTeacherQuizValidator, validateRequest, teacherQuizController.generateQuiz);

// Mode B — one question at a time, then finalize
router.post(
  '/custom/generate-question',
  aiLimiter,
  generateSingleQuestionValidator,
  validateRequest,
  teacherQuizController.generateSingleQuestion
);
router.post('/custom', createCustomQuizValidator, validateRequest, teacherQuizController.createCustomQuiz);

module.exports = router;
