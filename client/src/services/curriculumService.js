import api from './api';

async function getSubjects(gradeParam) {
  const { data } = await api.get('/curriculum/subjects', { params: gradeParam ? { grade: gradeParam } : {} });
  return data.data;
}

async function getChapters(subjectId) {
  const { data } = await api.get(`/curriculum/subjects/${subjectId}/chapters`);
  return data.data;
}

export default { getSubjects, getChapters };
