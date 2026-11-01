const asyncHandler = require('../utils/asyncHandler');
const chatService = require('../services/chat/chatService');

const openThread = asyncHandler(async (req, res) => {
  const thread = await chatService.getOrCreateThread(req.user, req.body.otherUserId);
  res.status(200).json({ success: true, data: { thread } });
});

const listThreads = asyncHandler(async (req, res) => {
  const threads = await chatService.listMyThreads(req.user);
  res.status(200).json({ success: true, data: { threads } });
});

const getMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.getMessages(req.user, req.params.threadId);
  res.status(200).json({ success: true, data: { messages } });
});

const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendMessage(req.user, req.params.threadId, req.body.content);
  res.status(201).json({ success: true, data: { message } });
});

module.exports = { openThread, listThreads, getMessages, sendMessage };
