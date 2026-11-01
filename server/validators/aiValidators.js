const { body, query } = require('express-validator');

const sendDoubtMessageValidator = [
  body('content').trim().notEmpty().withMessage('Please enter a question.').isLength({ max: 2000 }),
];

const teachingInsightValidator = [
  query('classId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid class filter'),
  query('studentId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid student filter'),
  query('dateRange').optional().isIn(['all', '7d', '30d']).withMessage('Invalid date range'),
  query('grade').optional().isIn(['all', '10th CBSE', '12th CBSE']).withMessage('Invalid grade filter'),
];

module.exports = { sendDoubtMessageValidator, teachingInsightValidator };
