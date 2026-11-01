const { query } = require('express-validator');

const DATE_RANGES = ['all', '7d', '30d'];

const studentAnalyticsValidator = [
  query('dateRange').optional().isIn(DATE_RANGES).withMessage('Invalid date range'),
];

const teacherAnalyticsValidator = [
  query('dateRange').optional().isIn(DATE_RANGES).withMessage('Invalid date range'),
  query('classId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid class filter'),
  query('studentId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid student filter'),
  query('grade').optional().isIn(['all', '10th CBSE', '12th CBSE']).withMessage('Invalid grade filter'),
];

module.exports = { studentAnalyticsValidator, teacherAnalyticsValidator };
