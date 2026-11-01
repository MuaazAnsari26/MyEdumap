import api from './api';

async function sendRequest(targetKey) {
  const { data } = await api.post('/connections/request', { targetKey });
  return data.data.request;
}

async function getIncoming() {
  const { data } = await api.get('/connections/incoming');
  return data.data.requests;
}

async function getOutgoing() {
  const { data } = await api.get('/connections/outgoing');
  return data.data.requests;
}

async function getConnections() {
  const { data } = await api.get('/connections');
  return data.data.connections;
}

async function accept(requestId) {
  const { data } = await api.patch(`/connections/${requestId}/accept`);
  return data.data.request;
}

async function reject(requestId) {
  const { data } = await api.patch(`/connections/${requestId}/reject`);
  return data.data.request;
}

async function cancel(requestId) {
  const { data } = await api.patch(`/connections/${requestId}/cancel`);
  return data.data.request;
}

export default { sendRequest, getIncoming, getOutgoing, getConnections, accept, reject, cancel };
