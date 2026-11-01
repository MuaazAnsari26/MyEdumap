import api, { setAccessToken } from './api';

async function updateProfile({ name, username, grade }) {
  const { data } = await api.patch('/users/profile', { name, username, grade });
  return data.data;
}

async function changePassword(currentPassword, newPassword) {
  const { data } = await api.patch('/users/password', { currentPassword, newPassword });
  // A password change rotates the session — update the in-memory access
  // token so the person isn't unexpectedly logged out.
  setAccessToken(data.data.accessToken);
  return data;
}

export default { updateProfile, changePassword };
