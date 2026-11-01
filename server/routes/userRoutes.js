const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { protect, requireVerifiedEmail } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { updateProfileValidator, changePasswordValidator } = require('../validators/userValidators');

router.use(protect, requireVerifiedEmail);

router.patch('/profile', updateProfileValidator, validateRequest, userController.updateProfile);
router.patch('/password', changePasswordValidator, validateRequest, userController.changePassword);

module.exports = router;
