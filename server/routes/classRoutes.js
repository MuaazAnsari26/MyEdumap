const express = require('express');
const router = express.Router();

const classController = require('../controllers/classController');
const { protect, restrictTo, requireVerifiedEmail } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { createClassValidator, joinClassValidator, classIdValidator } = require('../validators/classValidators');

router.use(protect, requireVerifiedEmail);

// Teacher-only
router.post('/', restrictTo('teacher'), createClassValidator, validateRequest, classController.createClass);
router.get('/', restrictTo('teacher'), classController.listMyClasses);
router.get('/:classId', restrictTo('teacher'), classIdValidator, validateRequest, classController.getClassDetail);

// Student-only
router.post('/join', restrictTo('student'), joinClassValidator, validateRequest, classController.joinClass);
router.get('/mine/joined', restrictTo('student'), classController.listMyJoinedClasses);

module.exports = router;
