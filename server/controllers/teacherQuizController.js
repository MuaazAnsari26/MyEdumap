const asyncHandler = require('../utils/asyncHandler');
const teacherQuizService = require('../services/quiz/teacherQuizService');

const generateQuiz = asyncHandler(async (req, res) => {
  const { title, subjectId, chapterId, numberOfQuestions } = req.body;
  const result = await teacherQuizService.generateQuiz(req.user, { title, subjectId, chapterId, numberOfQuestions });

  let message = 'Quiz generated.';
  if (result.actualCount < result.requestedCount) {
    message = `We could only put together ${result.actualCount} question(s) for this selection right now.`;
  } else if (result.usedBroaderFallback) {
    message = "We didn't have enough saved questions for this exact chapter yet, so this quiz includes some from the broader subject too.";
  }

  res.status(201).json({
    success: true,
    message,
    data: { teacherQuiz: result.teacherQuiz, questions: result.questions },
  });
});

const generateSingleQuestion = asyncHandler(async (req, res) => {
  const { subjectId, chapterId, topic } = req.body;
  const question = await teacherQuizService.generateSingleQuestionPreview(req.user, { subjectId, chapterId, topic });
  res.status(200).json({ success: true, data: { question } });
});

const createCustomQuiz = asyncHandler(async (req, res) => {
  const { title, grade, questions } = req.body;
  const teacherQuiz = await teacherQuizService.createCustomQuiz(req.user, { title, grade, questions });
  res.status(201).json({ success: true, message: 'Custom quiz saved.', data: { teacherQuiz } });
});

const listMyQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await teacherQuizService.listMyTeacherQuizzes(req.user);
  res.status(200).json({ success: true, data: { quizzes } });
});

module.exports = { generateQuiz, generateSingleQuestion, createCustomQuiz, listMyQuizzes };
