import api from './api';

// ---------- Teacher ----------
async function assignQuiz(teacherQuizId, payload) {
  const { data } = await api.post(`/assignments/teacher-quiz/${teacherQuizId}/assign`, payload);
  return data;
}

async function listAssignmentsForQuiz(teacherQuizId) {
  const { data } = await api.get(`/assignments/teacher-quiz/${teacherQuizId}`);
  return data.data.assignments;
}

// ---------- Student ----------
async function listMyAssignments() {
  const { data } = await api.get('/assignments/mine');
  return data.data.assignments;
}

async function getAssignmentForAttempt(assignmentId) {
  const { data } = await api.get(`/assignments/${assignmentId}/take`);
  return data.data.assignment;
}

async function submitAssignmentAttempt(assignmentId, answers) {
  const { data } = await api.post(`/assignments/${assignmentId}/submit`, { answers });
  return data.data.result;
}

async function getAssignmentResult(assignmentId) {
  const { data } = await api.get(`/assignments/${assignmentId}/result`);
  return data.data.result;
}

export default {
  assignQuiz,
  listAssignmentsForQuiz,
  listMyAssignments,
  getAssignmentForAttempt,
  submitAssignmentAttempt,
  getAssignmentResult,
};
