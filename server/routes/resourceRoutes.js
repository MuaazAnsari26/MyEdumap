const express = require('express');
const router = express.Router();

const resourceController = require('../controllers/resourceController');
const { protect, restrictTo, requireVerifiedEmail } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { upload } = require('../middleware/upload');
const {
  createResourceValidator,
  listResourcesValidator,
  resourceIdValidator,
} = require('../validators/resourceValidators');

router.use(protect, requireVerifiedEmail);

// Both roles can GET: students see their grade's resources, teachers see
// their own uploads (branching logic lives in the controller).
router.get('/', listResourcesValidator, validateRequest, resourceController.getResources);

// multer runs first so req.body (text fields) and req.file are populated
// before express-validator inspects them.
router.post(
  '/',
  restrictTo('teacher'),
  upload.single('file'),
  createResourceValidator,
  validateRequest,
  resourceController.createResource
);

router.delete(
  '/:resourceId',
  restrictTo('teacher'),
  resourceIdValidator,
  validateRequest,
  resourceController.removeResource
);

module.exports = router;
