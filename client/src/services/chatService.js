import api from './api';

async function listThreads() {
  const { data } = await api.get('/chat/threads');
  return data.data.threads;
}

async function openThread(otherUserId) {
  const { data } = await api.post('/chat/threads', { otherUserId });
  return data.data.thread;
}

async function getMessages(threadId) {
  const { data } = await api.get(`/chat/threads/${threadId}/messages`);
  return data.data.messages;
}

async function sendMessage(threadId, content) {
  const { data } = await api.post(`/chat/threads/${threadId}/messages`, { content });
  return data.data.message;
}

export default { listThreads, openThread, getMessages, sendMessage };
