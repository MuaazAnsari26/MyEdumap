const { body, param } = require('express-validator');

const openThreadValidator = [body('otherUserId').isMongoId().withMessage('A valid recipient is required')];

const threadIdValidator = [param('threadId').isMongoId().withMessage('Invalid conversation identifier')];

const sendMessageValidator = [
  body('content').trim().notEmpty().withMessage('Message cannot be empty.').isLength({ max: 2000 }),
];

module.exports = { openThreadValidator, threadIdValidator, sendMessageValidator };
