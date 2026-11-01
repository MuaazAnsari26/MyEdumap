const express = require('express');
const router = express.Router();

const quizController = require('../controllers/quizController');
const { protect, restrictTo, requireVerifiedEmail } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiters');
const validateRequest = require('../middleware/validateRequest');
const {
  generateQuizValidator,
  quizIdValidator,
  submitAttemptValidator,
  attemptIdValidator,
} = require('../validators/quizValidators');

router.use(protect, requireVerifiedEmail, restrictTo('student'));

router.post('/generate', aiLimiter, generateQuizValidator, validateRequest, quizController.generateQuiz);
router.get('/:quizId', quizIdValidator, validateRequest, quizController.getQuiz);
router.post(
  '/:quizId/submit',
  quizIdValidator,
  submitAttemptValidator,
  validateRequest,
  quizController.submitAttempt
);

router.get('/attempts/mine', quizController.listAttempts);
router.get('/attempts/:attemptId', attemptIdValidator, validateRequest, quizController.getAttemptDetail);

module.exports = router;
