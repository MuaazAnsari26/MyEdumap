import api, { setAccessToken } from './api';

async function registerStudent(payload) {
  const { data } = await api.post('/auth/register/student', payload);
  return data;
}

async function registerTeacher(payload) {
  const { data } = await api.post('/auth/register/teacher', payload);
  return data;
}

async function login({ identifier, password }) {
  const { data } = await api.post('/auth/login', { identifier, password });
  setAccessToken(data.data.accessToken);
  return data.data.user;
}

async function logout() {
  await api.post('/auth/logout');
  setAccessToken(null);
}

async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.data;
}

async function tryRefreshSession() {
  const { data } = await api.post('/auth/refresh');
  setAccessToken(data.data.accessToken);
  return data.data.user;
}

async function verifyEmail(token) {
  const { data } = await api.post('/auth/verify-email', { token });
  return data;
}

async function resendVerification(email) {
  const { data } = await api.post('/auth/resend-verification', { email });
  return data;
}

export default {
  registerStudent,
  registerTeacher,
  login,
  logout,
  fetchCurrentUser,
  tryRefreshSession,
  verifyEmail,
  resendVerification,
};
