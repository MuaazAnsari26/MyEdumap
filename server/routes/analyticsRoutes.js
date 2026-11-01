const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo, requireVerifiedEmail } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { studentAnalyticsValidator, teacherAnalyticsValidator } = require('../validators/analyticsValidators');

router.use(protect, requireVerifiedEmail);

router.get('/student', restrictTo('student'), studentAnalyticsValidator, validateRequest, analyticsController.getMyAnalytics);
router.get(
  '/teacher',
  restrictTo('teacher'),
  teacherAnalyticsValidator,
  validateRequest,
  analyticsController.getTeacherAnalyticsHandler
);

module.exports = router;
