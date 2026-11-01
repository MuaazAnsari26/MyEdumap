const asyncHandler = require('../utils/asyncHandler');
const quizGenerationService = require('../services/quiz/quizGenerationService');
const quizAttemptService = require('../services/quiz/quizAttemptService');

const generateQuiz = asyncHandler(async (req, res) => {
  const { subjectId, chapterId, numberOfQuestions } = req.body;
  const result = await quizGenerationService.generateQuiz(req.user, { subjectId, chapterId, numberOfQuestions });

  let message = 'Quiz generated.';
  if (result.actualCount < result.requestedCount) {
    message = `We could only put together ${result.actualCount} question(s) for this selection right now.`;
  } else if (result.usedBroaderFallback) {
    message = "We didn't have enough saved questions for this exact chapter yet, so this quiz includes some from the broader subject too.";
  }

  res.status(201).json({
    success: true,
    message,
    data: {
      quizId: result.quiz._id,
      totalQuestions: result.quiz.totalQuestions,
      questions: result.questionsForAttempt,
      generationSource: result.quiz.generationSource,
    },
  });
});

const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizAttemptService.getQuizForAttempt(req.user, req.params.quizId);
  res.status(200).json({ success: true, data: { quiz } });
});

const submitAttempt = asyncHandler(async (req, res) => {
  const result = await quizAttemptService.submitAttempt(req.user, req.params.quizId, req.body.answers);
  res.status(201).json({ success: true, message: 'Quiz submitted.', data: { result } });
});

const listAttempts = asyncHandler(async (req, res) => {
  const attempts = await quizAttemptService.listAttemptsForStudent(req.user);
  res.status(200).json({ success: true, data: { attempts } });
});

const getAttemptDetail = asyncHandler(async (req, res) => {
  const result = await quizAttemptService.getAttemptDetail(req.user, req.params.attemptId);
  res.status(200).json({ success: true, data: { result } });
});

module.exports = { generateQuiz, getQuiz, submitAttempt, listAttempts, getAttemptDetail };
