const { body, query, param } = require('express-validator');

const RESOURCE_TYPES = ['pdf', 'document', 'notes', 'video', 'link', 'assignment'];
const GRADES = ['10th CBSE', '12th CBSE'];

const createResourceValidator = [
  body('grade').isIn(GRADES).withMessage('A valid grade is required'),
  body('subjectId').isMongoId().withMessage('A valid subject is required'),
  body('chapterId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid chapter'),
  body('type').isIn(RESOURCE_TYPES).withMessage('Invalid resource type'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('description').optional({ checkFalsy: true }).isLength({ max: 500 }),
  body('externalUrl')
    .if(body('type').equals('link'))
    .trim()
    .notEmpty()
    .withMessage('A link is required for this resource type')
    .isURL()
    .withMessage('Please enter a valid URL'),
];

const listResourcesValidator = [
  query('subjectId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid subject filter'),
  query('chapterId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid chapter filter'),
];

const resourceIdValidator = [param('resourceId').isMongoId().withMessage('Invalid resource identifier')];

module.exports = { createResourceValidator, listResourcesValidator, resourceIdValidator };
