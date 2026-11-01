const { body, param } = require('express-validator');

const createClassValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Class name is required')
    .isLength({ max: 60 })
    .withMessage('Class name cannot exceed 60 characters'),
];

const joinClassValidator = [
  body('classKey')
    .trim()
    .notEmpty()
    .withMessage('A class key is required')
    .matches(/^EDU-CLS-[A-Z0-9]{6}$/i)
    .withMessage('That doesn\u2019t look like a valid class key'),
];

const classIdValidator = [param('classId').isMongoId().withMessage('Invalid class identifier')];

module.exports = { createClassValidator, joinClassValidator, classIdValidator };
