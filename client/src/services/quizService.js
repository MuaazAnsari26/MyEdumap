import api from './api';

async function generateQuiz({ subjectId, chapterId, numberOfQuestions }) {
  const { data } = await api.post('/quizzes/generate', { subjectId, chapterId, numberOfQuestions });
  return data;
}

async function getQuiz(quizId) {
  const { data } = await api.get(`/quizzes/${quizId}`);
  return data.data.quiz;
}

async function submitAttempt(quizId, answers) {
  const { data } = await api.post(`/quizzes/${quizId}/submit`, { answers });
  return data.data.result;
}

async function listAttempts() {
  const { data } = await api.get('/quizzes/attempts/mine');
  return data.data.attempts;
}

async function getAttemptDetail(attemptId) {
  const { data } = await api.get(`/quizzes/attempts/${attemptId}`);
  return data.data.result;
}

export default { generateQuiz, getQuiz, submitAttempt, listAttempts, getAttemptDetail };
