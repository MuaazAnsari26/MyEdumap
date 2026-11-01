const { body, param } = require('express-validator');

const assignQuizValidator = [
  body('assignedVia').isIn(['single', 'selected', 'class', 'all']).withMessage('Invalid assignment type'),
  body('studentId').if(body('assignedVia').equals('single')).isMongoId().withMessage('A valid student is required'),
  body('studentIds')
    .if(body('assignedVia').equals('selected'))
    .isArray({ min: 1 })
    .withMessage('Select at least one student'),
  body('studentIds.*').if(body('assignedVia').equals('selected')).isMongoId(),
  body('classId').if(body('assignedVia').equals('class')).isMongoId().withMessage('A valid class is required'),
];

const teacherQuizIdParamValidator = [param('teacherQuizId').isMongoId().withMessage('Invalid quiz identifier')];
const assignmentIdValidator = [param('assignmentId').isMongoId().withMessage('Invalid assignment identifier')];

module.exports = { assignQuizValidator, teacherQuizIdParamValidator, assignmentIdValidator };
