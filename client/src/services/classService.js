import api from './api';

async function createClass(name) {
  const { data } = await api.post('/classes', { name });
  return data.data.class;
}

async function listMyClasses() {
  const { data } = await api.get('/classes');
  return data.data.classes;
}

async function getClassDetail(classId) {
  const { data } = await api.get(`/classes/${classId}`);
  return data.data;
}

async function joinClass(classKey) {
  const { data } = await api.post('/classes/join', { classKey });
  return data.data;
}

async function listMyJoinedClasses() {
  const { data } = await api.get('/classes/mine/joined');
  return data.data.classes;
}

export default { createClass, listMyClasses, getClassDetail, joinClass, listMyJoinedClasses };
