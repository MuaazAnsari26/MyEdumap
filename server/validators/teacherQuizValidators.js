const { body, param } = require('express-validator');

const generateTeacherQuizValidator = [
  body('title').trim().notEmpty().withMessage('Quiz title is required').isLength({ max: 150 }),
  body('subjectId').isMongoId().withMessage('A valid subject is required'),
  body('chapterId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid chapter'),
  body('numberOfQuestions').isInt({ min: 1, max: 30 }).withMessage('Number of questions must be between 1 and 30'),
];

const generateSingleQuestionValidator = [
  body('subjectId').isMongoId().withMessage('A valid subject is required'),
  body('chapterId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid chapter'),
  body('topic').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
];

const createCustomQuizValidator = [
  body('title').trim().notEmpty().withMessage('Quiz title is required').isLength({ max: 150 }),
  body('grade').isIn(['10th CBSE', '12th CBSE']).withMessage('A valid grade is required'),
  body('questions').isArray({ min: 1, max: 30 }).withMessage('A quiz must have between 1 and 30 questions'),
  body('questions.*.subjectId').isMongoId().withMessage('Each question needs a valid subject'),
  body('questions.*.chapterId').optional({ checkFalsy: true }).isMongoId(),
  body('questions.*.questionText').trim().notEmpty().withMessage('Each question needs text'),
  body('questions.*.options').isArray({ min: 4, max: 4 }).withMessage('Each question needs exactly 4 options'),
  body('questions.*.correctAnswerIndex').isInt({ min: 0, max: 3 }),
  body('questions.*.explanation').trim().notEmpty().withMessage('Each question needs an explanation'),
];

const teacherQuizIdValidator = [param('teacherQuizId').isMongoId().withMessage('Invalid quiz identifier')];

module.exports = {
  generateTeacherQuizValidator,
  generateSingleQuestionValidator,
  createCustomQuizValidator,
  teacherQuizIdValidator,
};
