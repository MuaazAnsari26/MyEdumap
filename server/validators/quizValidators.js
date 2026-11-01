const { body, param } = require('express-validator');

const generateQuizValidator = [
  body('subjectId').isMongoId().withMessage('A valid subject is required'),
  body('chapterId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid chapter'),
  body('numberOfQuestions')
    .isInt({ min: 1, max: 15 })
    .withMessage('Number of questions must be between 1 and 15'),
];

const quizIdValidator = [param('quizId').isMongoId().withMessage('Invalid quiz identifier')];

const submitAttemptValidator = [
  body('answers').isArray().withMessage('Answers must be an array'),
  body('answers.*.questionId').isMongoId().withMessage('Invalid question identifier in answers'),
  body('answers.*.selectedOptionIndex')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 3 })
    .withMessage('selectedOptionIndex must be an integer 0-3'),
];

const attemptIdValidator = [param('attemptId').isMongoId().withMessage('Invalid attempt identifier')];

module.exports = { generateQuizValidator, quizIdValidator, submitAttemptValidator, attemptIdValidator };
