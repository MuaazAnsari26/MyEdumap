import api from './api';

async function generateQuiz({ title, subjectId, chapterId, numberOfQuestions }) {
  const { data } = await api.post('/teacher-quizzes/generate', { title, subjectId, chapterId, numberOfQuestions });
  return data;
}

async function generateSingleQuestion({ subjectId, chapterId, topic }) {
  const { data } = await api.post('/teacher-quizzes/custom/generate-question', { subjectId, chapterId, topic });
  return data.data.question;
}

async function createCustomQuiz({ title, grade, questions }) {
  const { data } = await api.post('/teacher-quizzes/custom', { title, grade, questions });
  return data.data.teacherQuiz;
}

async function listMyQuizzes() {
  const { data } = await api.get('/teacher-quizzes');
  return data.data.quizzes;
}

export default { generateQuiz, generateSingleQuestion, createCustomQuiz, listMyQuizzes };
