const AIConversation = require('../../models/AIConversation');
const AppError = require('../../utils/AppError');
const aiService = require('../ai/aiService');

const MAX_HISTORY_SENT_TO_AI = 16; // caps token growth on long conversations
const SYSTEM_INSTRUCTION =
  'You are EduMap\'s AI Doubt Solver, a friendly and patient tutor for CBSE students in grades 10 and 12. ' +
  'Explain concepts clearly and step by step, at a level appropriate for a school student. Keep answers focused ' +
  'and not overly long. If asked something unrelated to academics, gently redirect the conversation back to ' +
  'schoolwork.';

async function getOrCreateConversation(studentUser) {
  let conversation = await AIConversation.findOne({ student: studentUser._id });
  if (!conversation) {
    conversation = await AIConversation.create({ student: studentUser._id, messages: [] });
  }
  return conversation;
}

async function getConversation(studentUser) {
  const conversation = await getOrCreateConversation(studentUser);
  return conversation.messages;
}

// Only persists the exchange if the AI actually replied — a failed
// attempt leaves no half-written turn in the conversation, so the
// frontend can simply let the student retry with the same text.
async function sendMessage(studentUser, content) {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    throw new AppError('Please enter a question.', 400, 'EMPTY_MESSAGE');
  }
  if (trimmed.length > 2000) {
    throw new AppError('That message is too long. Please shorten it.', 400, 'MESSAGE_TOO_LONG');
  }

  const conversation = await getOrCreateConversation(studentUser);

  const historyForAI = [
    ...conversation.messages.slice(-MAX_HISTORY_SENT_TO_AI).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: trimmed },
  ];

  let replyText;
  try {
    replyText = await aiService.generateDoubtSolverReply(historyForAI, SYSTEM_INSTRUCTION);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`AI doubt solver failed (${err.code || 'UNKNOWN'}): ${err.message}`);
    throw new AppError(
      'The AI doubt solver is currently unavailable. Please try again in a moment.',
      503,
      'AI_UNAVAILABLE'
    );
  }

  if (!replyText || !replyText.trim()) {
    throw new AppError(
      'The AI doubt solver is currently unavailable. Please try again in a moment.',
      503,
      'AI_UNAVAILABLE'
    );
  }

  conversation.messages.push({ role: 'user', content: trimmed });
  conversation.messages.push({ role: 'assistant', content: replyText.trim() });
  await conversation.save();

  return conversation.messages.slice(-2); // the new user+assistant pair
}

async function clearConversation(studentUser) {
  await AIConversation.deleteOne({ student: studentUser._id });
}

module.exports = { getConversation, sendMessage, clearConversation };
