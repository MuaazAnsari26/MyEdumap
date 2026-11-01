const express = require('express');
const router = express.Router();

const curriculumController = require('../controllers/curriculumController');
const { protect } = require('../middleware/auth');
const { param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

router.use(protect);

router.get('/subjects', curriculumController.getSubjects);
router.get(
  '/subjects/:subjectId/chapters',
  [param('subjectId').isMongoId().withMessage('Invalid subject identifier')],
  validateRequest,
  curriculumController.getChapters
);

module.exports = router;
