const ChatThread = require('../../models/ChatThread');
const Message = require('../../models/Message');
const Connection = require('../../models/Connection');
const AppError = require('../../utils/AppError');

async function assertConnected(teacherId, studentId) {
  const connection = await Connection.findOne({ teacher: teacherId, student: studentId, status: 'active' }).lean();
  if (!connection) {
    throw new AppError('You can only message someone you are connected with.', 403, 'NOT_CONNECTED');
  }
}

// Resolves (teacherId, studentId) from the current user + the other
// party's id, regardless of which role is calling.
function resolveTeacherStudentIds(currentUser, otherUserId) {
  return currentUser.role === 'teacher'
    ? { teacherId: currentUser._id, studentId: otherUserId }
    : { teacherId: otherUserId, studentId: currentUser._id };
}

// Idempotent: returns the existing thread if one already exists rather
// than erroring, since "open a conversation" is a natural repeat action.
async function getOrCreateThread(currentUser, otherUserId) {
  const { teacherId, studentId } = resolveTeacherStudentIds(currentUser, otherUserId);
  await assertConnected(teacherId, studentId);

  let thread = await ChatThread.findOne({ teacher: teacherId, student: studentId });
  if (!thread) {
    thread = await ChatThread.create({ teacher: teacherId, student: studentId });
  }
  return thread;
}

async function listMyThreads(currentUser) {
  const filter = currentUser.role === 'teacher' ? { teacher: currentUser._id } : { student: currentUser._id };
  const otherField = currentUser.role === 'teacher' ? 'student' : 'teacher';

  const threads = await ChatThread.find(filter)
    .populate(otherField, 'name email')
    .sort({ lastMessageAt: -1 })
    .lean();

  const unreadCounts = await Message.aggregate([
    { $match: { thread: { $in: threads.map((t) => t._id) }, sender: { $ne: currentUser._id }, read: false } },
    { $group: { _id: '$thread', count: { $sum: 1 } } },
  ]);
  const unreadByThread = new Map(unreadCounts.map((u) => [String(u._id), u.count]));

  return threads.map((t) => ({
    _id: t._id,
    otherUser: t[otherField],
    lastMessageAt: t.lastMessageAt,
    lastMessagePreview: t.lastMessagePreview,
    unreadCount: unreadByThread.get(String(t._id)) || 0,
  }));
}

async function assertParticipant(currentUser, thread) {
  const isParticipant =
    (currentUser.role === 'teacher' && String(thread.teacher) === String(currentUser._id)) ||
    (currentUser.role === 'student' && String(thread.student) === String(currentUser._id));
  if (!isParticipant) {
    throw new AppError('You do not have access to this conversation.', 403, 'FORBIDDEN');
  }
}

const MAX_MESSAGES_RETURNED = 200;

async function getMessages(currentUser, threadId) {
  const thread = await ChatThread.findById(threadId);
  if (!thread) {
    throw new AppError('Conversation not found.', 404, 'THREAD_NOT_FOUND');
  }
  await assertParticipant(currentUser, thread);

  // Capped and fetched newest-first, then reversed back to chronological
  // order — without this, a long-running conversation would get re-sent
  // in full on every 4-second poll (see ChatInbox.jsx), which only gets
  // slower as the thread grows. 200 messages is far more than a chat
  // panel realistically needs to show at once.
  const recentMessages = await Message.find({ thread: threadId })
    .sort({ createdAt: -1 })
    .limit(MAX_MESSAGES_RETURNED)
    .lean();

  await Message.updateMany({ thread: threadId, sender: { $ne: currentUser._id }, read: false }, { $set: { read: true } });

  return recentMessages.reverse();
}

async function sendMessage(currentUser, threadId, content) {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    throw new AppError('Message cannot be empty.', 400, 'EMPTY_MESSAGE');
  }
  if (trimmed.length > 2000) {
    throw new AppError('That message is too long.', 400, 'MESSAGE_TOO_LONG');
  }

  const thread = await ChatThread.findById(threadId);
  if (!thread) {
    throw new AppError('Conversation not found.', 404, 'THREAD_NOT_FOUND');
  }
  await assertParticipant(currentUser, thread);

  const message = await Message.create({ thread: threadId, sender: currentUser._id, content: trimmed });

  thread.lastMessageAt = message.createdAt;
  thread.lastMessagePreview = trimmed.slice(0, 140);
  await thread.save();

  return message;
}

module.exports = { getOrCreateThread, listMyThreads, getMessages, sendMessage };
