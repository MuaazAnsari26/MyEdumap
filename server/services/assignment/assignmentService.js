const TeacherQuiz = require('../../models/TeacherQuiz');
const QuizAssignment = require('../../models/QuizAssignment');
const Connection = require('../../models/Connection');
const Class = require('../../models/Class');
const ClassMembership = require('../../models/ClassMembership');
const StudentProfile = require('../../models/StudentProfile');
const AppError = require('../../utils/AppError');

// Every recipient-resolution path is scoped to students the teacher is
// actually connected to (or whose class the teacher owns) — a teacher
// can never assign a quiz to a student they have no relationship with,
// regardless of which assignment mode is used.
async function resolveRecipients(teacherUser, { assignedVia, studentId, studentIds, classId }) {
  if (assignedVia === 'single') {
    if (!studentId) throw new AppError('A student must be specified.', 400, 'MISSING_STUDENT');
    const connection = await Connection.findOne({ teacher: teacherUser._id, student: studentId, status: 'active' }).lean();
    if (!connection) {
      throw new AppError('You are not connected with that student.', 403, 'NOT_CONNECTED');
    }
    return { studentIds: [studentId], classRef: null };
  }

  if (assignedVia === 'selected') {
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new AppError('Select at least one student.', 400, 'MISSING_STUDENTS');
    }
    const connections = await Connection.find({
      teacher: teacherUser._id,
      student: { $in: studentIds },
      status: 'active',
    }).lean();
    const connectedIds = new Set(connections.map((c) => String(c.student)));
    const invalidIds = studentIds.filter((id) => !connectedIds.has(String(id)));
    if (invalidIds.length > 0) {
      throw new AppError('One or more selected students are not connected with you.', 403, 'NOT_CONNECTED');
    }
    return { studentIds, classRef: null };
  }

  if (assignedVia === 'class') {
    if (!classId) throw new AppError('A class must be specified.', 400, 'MISSING_CLASS');
    const classDoc = await Class.findOne({ _id: classId, teacher: teacherUser._id }).lean();
    if (!classDoc) {
      throw new AppError('Class not found.', 404, 'CLASS_NOT_FOUND');
    }
    const memberships = await ClassMembership.find({ class: classId, isActive: true }).lean();
    if (memberships.length === 0) {
      throw new AppError('This class has no students yet.', 400, 'EMPTY_CLASS');
    }
    return { studentIds: memberships.map((m) => m.student), classRef: classId };
  }

  if (assignedVia === 'all') {
    const connections = await Connection.find({ teacher: teacherUser._id, status: 'active' }).lean();
    if (connections.length === 0) {
      throw new AppError('You have no connected students to assign this quiz to.', 400, 'NO_STUDENTS');
    }
    return { studentIds: connections.map((c) => c.student), classRef: null };
  }

  throw new AppError('Invalid assignment type.', 400, 'INVALID_ASSIGNMENT_TYPE');
}

// Splits a list of student ids into those matching the required grade
// and those that don't, without assuming anything about how many there
// are — used to silently exclude mismatched students from bulk
// assignment actions (selected/class/all) while still reporting the
// exclusion count back to the teacher.
async function partitionByGrade(studentIds, grade) {
  if (studentIds.length === 0) return { matched: [], mismatchedCount: 0 };
  const profiles = await StudentProfile.find({ user: { $in: studentIds }, grade }).select('user').lean();
  const matchedSet = new Set(profiles.map((p) => String(p.user)));
  const matched = studentIds.filter((id) => matchedSet.has(String(id)));
  return { matched, mismatchedCount: studentIds.length - matched.length };
}

async function assignQuiz(teacherUser, teacherQuizId, options) {
  const teacherQuiz = await TeacherQuiz.findOne({ _id: teacherQuizId, teacher: teacherUser._id });
  if (!teacherQuiz) {
    throw new AppError('Quiz not found.', 404, 'QUIZ_NOT_FOUND');
  }

  const { studentIds, classRef } = await resolveRecipients(teacherUser, options);

  // Grade enforcement: a quiz built for one grade's curriculum can never
  // be assigned to a student in a different grade. For an explicit
  // single-student pick, fail loudly — the teacher chose exactly this
  // person, so a silent no-op would be confusing. For bulk selections
  // (selected/class/all), silently exclude mismatched students and
  // report the count, since a class or "all students" list can
  // legitimately span grades the teacher wasn't necessarily thinking
  // about when picking a broad option.
  let targetStudentIds = studentIds;
  let gradeMismatchedCount = 0;

  if (options.assignedVia === 'single') {
    const profile = await StudentProfile.findOne({ user: studentIds[0] }).select('grade').lean();
    if (!profile || profile.grade !== teacherQuiz.grade) {
      throw new AppError(
        `This quiz is for ${teacherQuiz.grade} students and can't be assigned to a student in a different grade.`,
        400,
        'GRADE_MISMATCH'
      );
    }
  } else {
    const { matched, mismatchedCount } = await partitionByGrade(studentIds, teacherQuiz.grade);
    targetStudentIds = matched;
    gradeMismatchedCount = mismatchedCount;
    if (targetStudentIds.length === 0) {
      throw new AppError(
        `None of the selected students are in ${teacherQuiz.grade}, which is required for this quiz.`,
        400,
        'GRADE_MISMATCH'
      );
    }
  }

  // Idempotent: pre-check who's already assigned so re-running "assign to
  // all" after connecting a new student only adds the new one, and never
  // errors out on the unique index for students already assigned.
  const existing = await QuizAssignment.find({
    teacherQuiz: teacherQuiz._id,
    student: { $in: targetStudentIds },
  }).lean();
  const alreadyAssigned = new Set(existing.map((a) => String(a.student)));
  const newStudentIds = targetStudentIds.filter((id) => !alreadyAssigned.has(String(id)));

  if (newStudentIds.length > 0) {
    await QuizAssignment.insertMany(
      newStudentIds.map((studentId) => ({
        teacherQuiz: teacherQuiz._id,
        teacher: teacherUser._id,
        student: studentId,
        assignedVia: options.assignedVia,
        classRef,
      }))
    );
  }

  return {
    assignedCount: newStudentIds.length,
    alreadyAssignedCount: alreadyAssigned.size,
    gradeMismatchedCount,
    totalRecipients: studentIds.length,
  };
}

async function listAssignmentsForQuiz(teacherUser, teacherQuizId) {
  const teacherQuiz = await TeacherQuiz.findOne({ _id: teacherQuizId, teacher: teacherUser._id }).lean();
  if (!teacherQuiz) {
    throw new AppError('Quiz not found.', 404, 'QUIZ_NOT_FOUND');
  }

  return QuizAssignment.find({ teacherQuiz: teacherQuizId }).populate('student', 'name email').sort({ createdAt: -1 }).lean();
}

module.exports = { resolveRecipients, assignQuiz, listAssignmentsForQuiz };
