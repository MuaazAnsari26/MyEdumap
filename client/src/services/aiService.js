import api from './api';

// ---------- AI Doubt Solver (student) ----------
async function getConversation() {
  const { data } = await api.get('/ai/doubt-solver');
  return data.data.messages;
}

async function sendDoubtMessage(content) {
  const { data } = await api.post('/ai/doubt-solver', { content });
  return data.data.messages; // [userMessage, assistantMessage]
}

async function clearConversation() {
  const { data } = await api.delete('/ai/doubt-solver');
  return data;
}

// ---------- AI Teaching Insights (teacher) ----------
async function getTeachingInsight({ classId, studentId, dateRange, grade } = {}) {
  const params = {};
  if (classId) params.classId = classId;
  if (studentId) params.studentId = studentId;
  if (dateRange) params.dateRange = dateRange;
  if (grade) params.grade = grade;
  const { data } = await api.get('/ai/insights', { params });
  return data.data;
}

export default { getConversation, sendDoubtMessage, clearConversation, getTeachingInsight };
