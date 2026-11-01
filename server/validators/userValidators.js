const { body } = require('express-validator');

const updateProfileValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('username')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and dots'),
  body('grade')
    .optional({ checkFalsy: true })
    .isIn(['10th CBSE', '12th CBSE'])
    .withMessage('Grade must be either "10th CBSE" or "12th CBSE"'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('New password must contain at least one number'),
];

module.exports = { updateProfileValidator, changePasswordValidator };
