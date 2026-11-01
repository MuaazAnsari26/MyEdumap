const { body, param } = require('express-validator');

const sendRequestValidator = [
  body('targetKey')
    .trim()
    .notEmpty()
    .withMessage('A connection key is required')
    .matches(/^EDU-(STU|TCH)-[A-Z0-9]{6}$/i)
    .withMessage('That doesn\u2019t look like a valid connection key'),
];

const requestIdValidator = [param('requestId').isMongoId().withMessage('Invalid request identifier')];

module.exports = { sendRequestValidator, requestIdValidator };
