const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');
const {
  studentRegisterValidator,
  teacherRegisterValidator,
  loginValidator,
} = require('../validators/authValidators');

router.post(
  '/register/student',
  authLimiter,
  studentRegisterValidator,
  validateRequest,
  authController.registerStudent
);

router.post(
  '/register/teacher',
  authLimiter,
  teacherRegisterValidator,
  validateRequest,
  authController.registerTeacher
);

router.post('/verify-email', authLimiter, authController.verifyEmail);
router.post('/resend-verification', authLimiter, authController.resendVerification);

router.post('/login', authLimiter, loginValidator, validateRequest, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.get('/me', protect, authController.getMe);

module.exports = router;
