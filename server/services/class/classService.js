const Class = require('../../models/Class');
const ClassMembership = require('../../models/ClassMembership');
const StudentProfile = require('../../models/StudentProfile');
const TeacherProfile = require('../../models/TeacherProfile');
const AppError = require('../../utils/AppError');
const { generateUniqueClassKey } = require('../auth/keyGenerator');
const { establishConnection, areAlreadyConnected } = require('../connection/connectionService');

async function createClass(teacherUser, name) {
  const classKey = await generateUniqueClassKey(Class);

  const newClass = await Class.create({
    teacher: teacherUser._id,
    name: name.trim(),
    classKey,
  });

  await TeacherProfile.updateOne({ user: teacherUser._id }, { $inc: { classCount: 1 } });

  return newClass;
}

async function listClassesForTeacher(teacherUser) {
  return Class.find({ teacher: teacherUser._id, isActive: true }).sort({ createdAt: -1 }).lean();
}

async function getClassDetailForTeacher(teacherUser, classId) {
  const classDoc = await Class.findOne({ _id: classId, teacher: teacherUser._id });

  if (!classDoc) {
    throw new AppError('Class not found.', 404, 'CLASS_NOT_FOUND');
  }

  const memberships = await ClassMembership.find({ class: classDoc._id, isActive: true })
    .populate('student', 'name email username')
    .sort({ joinedAt: -1 })
    .lean();

  return { classDoc, students: memberships.map((m) => ({ ...m.student, joinedAt: m.joinedAt })) };
}

// A student joining a class both records membership AND establishes a
// student-teacher Connection (if one doesn't already exist), since a
// teacher needs that connection to eventually see the student's
// performance data. This is a deliberate product decision: the class key
// is for organizing students into a class, but a teacher still needs a
// real connection to view an individual student's analytics later.
async function joinClassByKey(studentUser, classKey) {
  const normalized = (classKey || '').trim().toUpperCase();

  if (!normalized.startsWith('EDU-CLS-')) {
    throw new AppError('That doesn\u2019t look like a valid class key.', 400, 'INVALID_CLASS_KEY');
  }

  const classDoc = await Class.findOne({ classKey: normalized, isActive: true });
  if (!classDoc) {
    throw new AppError('No class found with that key. Double-check it with your teacher.', 404, 'CLASS_NOT_FOUND');
  }

  const existingMembership = await ClassMembership.findOne({ class: classDoc._id, student: studentUser._id });
  if (existingMembership) {
    throw new AppError('You have already joined this class.', 409, 'ALREADY_MEMBER');
  }

  const membership = await ClassMembership.create({
    class: classDoc._id,
    student: studentUser._id,
  });

  await Class.updateOne({ _id: classDoc._id }, { $inc: { studentCount: 1 } });

  const wasAlreadyConnected = await areAlreadyConnected(studentUser._id, classDoc.teacher);
  await establishConnection({
    studentUserId: studentUser._id,
    teacherUserId: classDoc.teacher,
    source: 'class_join',
  });

  // Only bump the student's class count here — connectedTeacherCount is
  // already incremented inside establishConnection when a new connection
  // is actually created, so we don't double count it.
  await StudentProfile.updateOne({ user: studentUser._id }, { $inc: { classCount: 1 } });

  return { classDoc, membership, newConnectionCreated: !wasAlreadyConnected };
}

async function listClassesForStudent(studentUser) {
  const memberships = await ClassMembership.find({ student: studentUser._id, isActive: true })
    .populate({ path: 'class', populate: { path: 'teacher', select: 'name email' } })
    .sort({ joinedAt: -1 })
    .lean();

  return memberships
    .filter((m) => m.class) // guard against a class that was later deleted
    .map((m) => ({
      id: m.class._id,
      name: m.class.name,
      teacher: m.class.teacher,
      joinedAt: m.joinedAt,
    }));
}

module.exports = {
  createClass,
  listClassesForTeacher,
  getClassDetailForTeacher,
  joinClassByKey,
  listClassesForStudent,
};
