import api from './api';

async function getMyAnalytics({ dateRange } = {}) {
  const params = {};
  if (dateRange) params.dateRange = dateRange;
  const { data } = await api.get('/analytics/student', { params });
  return data.data;
}

async function getTeacherAnalytics({ classId, studentId, dateRange, grade } = {}) {
  const params = {};
  if (classId) params.classId = classId;
  if (studentId) params.studentId = studentId;
  if (dateRange) params.dateRange = dateRange;
  if (grade) params.grade = grade;
  const { data } = await api.get('/analytics/teacher', { params });
  return data.data;
}

export default { getMyAnalytics, getTeacherAnalytics };
