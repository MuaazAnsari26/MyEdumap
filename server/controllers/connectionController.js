const asyncHandler = require('../utils/asyncHandler');
const connectionService = require('../services/connection/connectionService');

const sendRequest = asyncHandler(async (req, res) => {
  const request = await connectionService.sendConnectionRequest(req.user, req.body.targetKey);
  res.status(201).json({
    success: true,
    message: 'Connection request sent.',
    data: { request },
  });
});

const getIncoming = asyncHandler(async (req, res) => {
  const requests = await connectionService.listIncomingRequests(req.user);
  res.status(200).json({ success: true, data: { requests } });
});

const getOutgoing = asyncHandler(async (req, res) => {
  const requests = await connectionService.listOutgoingRequests(req.user);
  res.status(200).json({ success: true, data: { requests } });
});

const getConnections = asyncHandler(async (req, res) => {
  const connections = await connectionService.listConnections(req.user);
  res.status(200).json({ success: true, data: { connections } });
});

const accept = asyncHandler(async (req, res) => {
  const request = await connectionService.respondToRequest(req.user, req.params.requestId, 'accept');
  res.status(200).json({ success: true, message: 'Connection accepted.', data: { request } });
});

const reject = asyncHandler(async (req, res) => {
  const request = await connectionService.respondToRequest(req.user, req.params.requestId, 'reject');
  res.status(200).json({ success: true, message: 'Connection request declined.', data: { request } });
});

const cancel = asyncHandler(async (req, res) => {
  const request = await connectionService.cancelRequest(req.user, req.params.requestId);
  res.status(200).json({ success: true, message: 'Request cancelled.', data: { request } });
});

module.exports = { sendRequest, getIncoming, getOutgoing, getConnections, accept, reject, cancel };
