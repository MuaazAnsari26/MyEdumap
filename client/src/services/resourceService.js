import api from './api';

async function listResources({ subjectId, chapterId } = {}) {
  const params = {};
  if (subjectId) params.subjectId = subjectId;
  if (chapterId) params.chapterId = chapterId;
  const { data } = await api.get('/resources', { params });
  return data.data;
}

async function uploadResource(formValues, file) {
  const formData = new FormData();
  Object.entries(formValues).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  if (file) formData.append('file', file);

  const { data } = await api.post('/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.resource;
}

async function deleteResource(resourceId) {
  const { data } = await api.delete(`/resources/${resourceId}`);
  return data;
}

export default { listResources, uploadResource, deleteResource };
