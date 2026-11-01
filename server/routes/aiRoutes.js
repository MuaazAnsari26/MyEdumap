const express = require('express');
const router = express.Router();

const doubtSolverController = require('../controllers/doubtSolverController');
const aiInsightController = require('../controllers/aiInsightController');
const { protect, restrictTo, requireVerifiedEmail } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiters');
const validateRequest = require('../middleware/validateRequest');
const { sendDoubtMessageValidator, teachingInsightValidator } = require('../validators/aiValidators');

router.use(protect, requireVerifiedEmail);

// ---------- Student: AI Doubt Solver ----------
router.get('/doubt-solver', restrictTo('student'), doubtSolverController.getConversation);
router.post(
  '/doubt-solver',
  restrictTo('student'),
  aiLimiter,
  sendDoubtMessageValidator,
  validateRequest,
  doubtSolverController.sendMessage
);
router.delete('/doubt-solver', restrictTo('student'), doubtSolverController.clearConversation);

// ---------- Teacher: AI Teaching Insights ----------
router.get(
  '/insights',
  restrictTo('teacher'),
  aiLimiter,
  teachingInsightValidator,
  validateRequest,
  aiInsightController.getInsight
);

module.exports = router;
