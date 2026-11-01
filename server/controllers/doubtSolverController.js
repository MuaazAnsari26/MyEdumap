const asyncHandler = require('../utils/asyncHandler');
const doubtSolverService = require('../services/ai/doubtSolverService');

const getConversation = asyncHandler(async (req, res) => {
  const messages = await doubtSolverService.getConversation(req.user);
  res.status(200).json({ success: true, data: { messages } });
});

const sendMessage = asyncHandler(async (req, res) => {
  const newMessages = await doubtSolverService.sendMessage(req.user, req.body.content);
  res.status(201).json({ success: true, data: { messages: newMessages } });
});

const clearConversation = asyncHandler(async (req, res) => {
  await doubtSolverService.clearConversation(req.user);
  res.status(200).json({ success: true, message: 'Conversation cleared.' });
});

module.exports = { getConversation, sendMessage, clearConversation };
