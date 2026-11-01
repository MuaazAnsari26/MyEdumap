const User = require('../../models/User');
const StudentProfile = require('../../models/StudentProfile');
const TeacherProfile = require('../../models/TeacherProfile');
const ConnectionRequest = require('../../models/ConnectionRequest');
const Connection = require('../../models/Connection');
const AppError = require('../../utils/AppError');

// Looks up which user (and role) owns a given connection key, regardless
// of whether it's a student or teacher key. Returns null if not found so
// callers can produce a friendly "invalid key" error.
async function resolveUserByConnectionKey(key) {
  const normalized = (key || '').trim().toUpperCase();

  if (normalized.startsWith('EDU-STU-')) {
    const profile = await StudentProfile.findOne({ connectionKey: normalized });
    if (!profile) return null;
    const user = await User.findById(profile.user);
    return user ? { user, role: 'student', profile } : null;
  }

  if (normalized.startsWith('EDU-TCH-')) {
    const profile = await TeacherProfile.findOne({ connectionKey: normalized });
    if (!profile) return null;
    const user = await User.findById(profile.user);
    return user ? { user, role: 'teacher', profile } : null;
  }

  return null;
}

async function areAlreadyConnected(studentId, teacherId) {
  const existing = await Connection.findOne({
    student: studentId,
    teacher: teacherId,
    status: 'active',
  }).lean();
  return !!existing;
}

// Creates the actual Connection document plus keeps the denormalized
// counters on both profiles roughly in sync. Shared by request-acceptance
// and class-join flows so there's exactly one place that establishes a
// connection.
async function establishConnection({ studentUserId, teacherUserId, source, sourceRequestId }) {
  const alreadyConnected = await areAlreadyConnected(studentUserId, teacherUserId);
  if (alreadyConnected) {
    return Connection.findOne({ student: studentUserId, teacher: teacherUserId, status: 'active' });
  }

  const connection = await Connection.create({
    student: studentUserId,
    teacher: teacherUserId,
    source,
    sourceRequest: sourceRequestId || undefined,
  });

  // Best-effort counter updates. If one of these fails after the
  // Connection document above was already written, the relationship
  // itself (the source of truth) is still correct — only a dashboard
  // number would need reconciling, not the connection itself.
  await StudentProfile.updateOne({ user: studentUserId }, { $inc: { connectedTeacherCount: 1 } });
  await TeacherProfile.updateOne({ user: teacherUserId }, { $inc: { connectedStudentCount: 1 } });

  return connection;
}

// ---------- Sending a request ----------
async function sendConnectionRequest(currentUser, targetKey) {
  const target = await resolveUserByConnectionKey(targetKey);

  if (!target) {
    throw new AppError('That connection key doesn\u2019t match any account. Double-check and try again.', 404, 'INVALID_KEY');
  }

  if (target.user._id.equals(currentUser._id)) {
    throw new AppError('You can\u2019t connect with your own account.', 400, 'SELF_CONNECTION');
  }

  if (target.role === currentUser.role) {
    throw new AppError('Students can only connect with teachers, and teachers with students.', 400, 'INVALID_ROLE_PAIR');
  }

  const studentId = currentUser.role === 'student' ? currentUser._id : target.user._id;
  const teacherId = currentUser.role === 'teacher' ? currentUser._id : target.user._id;

  if (await areAlreadyConnected(studentId, teacherId)) {
    throw new AppError('You are already connected with this person.', 409, 'ALREADY_CONNECTED');
  }

  // Block duplicates in either direction: A already asked B, or B already
  // asked A, while a decision is still pending.
  const existingPending = await ConnectionRequest.findOne({
    status: 'pending',
    $or: [
      { requester: currentUser._id, recipient: target.user._id },
      { requester: target.user._id, recipient: currentUser._id },
    ],
  });

  if (existingPending) {
    throw new AppError('There is already a pending connection request between you two.', 409, 'DUPLICATE_REQUEST');
  }

  const request = await ConnectionRequest.create({
    requester: currentUser._id,
    requesterRole: currentUser.role,
    recipient: target.user._id,
    recipientRole: target.role,
    status: 'pending',
  });

  return request;
}

// ---------- Responding to a request ----------
async function respondToRequest(currentUser, requestId, decision) {
  const request = await ConnectionRequest.findById(requestId);

  if (!request) {
    throw new AppError('Connection request not found.', 404, 'REQUEST_NOT_FOUND');
  }

  if (!request.recipient.equals(currentUser._id)) {
    throw new AppError('You are not authorized to respond to this request.', 403, 'FORBIDDEN');
  }

  if (request.status !== 'pending') {
    throw new AppError(`This request has already been ${request.status}.`, 409, 'REQUEST_ALREADY_RESOLVED');
  }

  request.status = decision === 'accept' ? 'accepted' : 'rejected';
  request.respondedAt = new Date();
  await request.save();

  if (decision === 'accept') {
    const studentId = request.requesterRole === 'student' ? request.requester : request.recipient;
    const teacherId = request.requesterRole === 'teacher' ? request.requester : request.recipient;

    await establishConnection({
      studentUserId: studentId,
      teacherUserId: teacherId,
      source: 'connection_request',
      sourceRequestId: request._id,
    });
  }

  return request;
}

// ---------- Cancelling your own outgoing request ----------
async function cancelRequest(currentUser, requestId) {
  const request = await ConnectionRequest.findById(requestId);

  if (!request) {
    throw new AppError('Connection request not found.', 404, 'REQUEST_NOT_FOUND');
  }

  if (!request.requester.equals(currentUser._id)) {
    throw new AppError('You can only cancel requests you sent.', 403, 'FORBIDDEN');
  }

  if (request.status !== 'pending') {
    throw new AppError(`This request has already been ${request.status} and can\u2019t be cancelled.`, 409, 'REQUEST_ALREADY_RESOLVED');
  }

  request.status = 'cancelled';
  request.respondedAt = new Date();
  await request.save();

  return request;
}

// ---------- Listing ----------
async function listIncomingRequests(currentUser) {
  return ConnectionRequest.find({ recipient: currentUser._id, status: 'pending' })
    .populate('requester', 'name email username role')
    .sort({ createdAt: -1 })
    .lean();
}

async function listOutgoingRequests(currentUser) {
  return ConnectionRequest.find({ requester: currentUser._id, status: 'pending' })
    .populate('recipient', 'name email username role')
    .sort({ createdAt: -1 })
    .lean();
}

async function listConnections(currentUser) {
  const filter =
    currentUser.role === 'student'
      ? { student: currentUser._id, status: 'active' }
      : { teacher: currentUser._id, status: 'active' };

  const populateField = currentUser.role === 'student' ? 'teacher' : 'student';

  const connections = await Connection.find(filter)
    .populate(populateField, 'name email username role')
    .sort({ connectedAt: -1 })
    .lean();

  // For a teacher's connection list specifically, attach each student's
  // grade — the quiz-assignment UI needs this to prevent picking a
  // student whose grade doesn't match the quiz before the request is
  // even sent, not just reject it after the fact.
  if (currentUser.role === 'teacher' && connections.length > 0) {
    const studentIds = connections.map((c) => c.student).filter(Boolean);
    const profiles = await StudentProfile.find({ user: { $in: studentIds } }).select('user grade').lean();
    const gradeByStudentId = new Map(profiles.map((p) => [String(p.user), p.grade]));
    connections.forEach((c) => {
      if (c.student) {
        c.student.grade = gradeByStudentId.get(String(c.student._id)) || null;
      }
    });
  }

  return connections;
}

module.exports = {
  resolveUserByConnectionKey,
  establishConnection,
  areAlreadyConnected,
  sendConnectionRequest,
  respondToRequest,
  cancelRequest,
  listIncomingRequests,
  listOutgoingRequests,
  listConnections,
};
