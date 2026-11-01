const Connection = require('../../models/Connection');
const Class = require('../../models/Class');
const ClassMembership = require('../../models/ClassMembership');
const QuizAssignment = require('../../models/QuizAssignment');
const StudentProfile = require('../../models/StudentProfile');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const { getAttemptRecordsForStudents } = require('./attemptRecords');
const {
  bySubject,
  byChapter,
  overallStats,
  progressOverTime,
  classifyStrengthAndWeakness,
  scoreDistribution,
} = require('./analyticsMath');
const { applyDateRange } = require('./studentAnalyticsService');

const NEEDS_ATTENTION_THRESHOLD = 50;
const VALID_GRADES = ['10th CBSE', '12th CBSE'];

async function getConnectedStudentIds(teacherUser) {
  const connections = await Connection.find({ teacher: teacherUser._id, status: 'active' }).select('student').lean();
  return connections.map((c) => c.student);
}

async function getStudentsInClass(teacherUser, classId) {
  const classDoc = await Class.findOne({ _id: classId, teacher: teacherUser._id }).lean();
  if (!classDoc) {
    throw new AppError('Class not found.', 404, 'CLASS_NOT_FOUND');
  }
  const memberships = await ClassMembership.find({ class: classId, isActive: true }).select('student').lean();
  return { classDoc, studentIds: memberships.map((m) => m.student) };
}

// Narrows a list of student ids down to only those in the given grade.
async function filterStudentIdsByGrade(studentIds, grade) {
  if (!grade || grade === 'all' || studentIds.length === 0) return studentIds;
  const profiles = await StudentProfile.find({ user: { $in: studentIds }, grade }).select('user').lean();
  const matched = new Set(profiles.map((p) => String(p.user)));
  return studentIds.filter((id) => matched.has(String(id)));
}

async function getCompletionRate(teacherUser, studentIds) {
  if (studentIds.length === 0) return null;
  const total = await QuizAssignment.countDocuments({ teacher: teacherUser._id, student: { $in: studentIds } });
  if (total === 0) return null;
  const completed = await QuizAssignment.countDocuments({
    teacher: teacherUser._id,
    student: { $in: studentIds },
    status: 'completed',
  });
  return Math.round((completed / total) * 100);
}

function countStudentsNeedingAttention(studentIds, records) {
  const byStudent = new Map();
  records.forEach((r) => {
    const key = String(r.student);
    if (!byStudent.has(key)) byStudent.set(key, []);
    byStudent.get(key).push(r);
  });

  let count = 0;
  byStudent.forEach((studentRecords) => {
    const stats = overallStats(studentRecords);
    if (stats.weightedAccuracyPercentage !== null && stats.weightedAccuracyPercentage < NEEDS_ATTENTION_THRESHOLD) {
      count += 1;
    }
  });
  return count;
}

// Class comparison is only meaningful at the "all classes" overview level.
async function getClassComparison(teacherUser, dateRange, grade) {
  const classes = await Class.find({ teacher: teacherUser._id, isActive: true }).lean();
  const results = [];

  for (const classDoc of classes) {
    // eslint-disable-next-line no-await-in-loop
    const memberships = await ClassMembership.find({ class: classDoc._id, isActive: true }).select('student').lean();
    // eslint-disable-next-line no-await-in-loop
    const studentIds = await filterStudentIdsByGrade(memberships.map((m) => m.student), grade);
    if (studentIds.length === 0) {
      results.push({ classId: classDoc._id, className: classDoc.name, studentCount: 0, averagePercentage: null });
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const records = applyDateRange(await getAttemptRecordsForStudents(studentIds), dateRange);
    const stats = overallStats(records);
    results.push({
      classId: classDoc._id,
      className: classDoc.name,
      studentCount: studentIds.length,
      averagePercentage: stats.weightedAccuracyPercentage,
    });
  }

  return results;
}

function emptyWeakStrong() {
  return { subjects: [], chapters: [] };
}

// The single entry point for teacher analytics. Which "level" of report
// this returns is determined entirely by which filters are present:
//   studentId given -> individual student report
//   classId given    -> whole-class report
//   neither given     -> all-classes overview (optionally narrowed by grade)
async function getTeacherAnalytics(teacherUser, { classId, studentId, dateRange, grade } = {}) {
  let studentIds;
  let classDoc = null;
  let studentProfile = null;

  if (studentId) {
    const connection = await Connection.findOne({ teacher: teacherUser._id, student: studentId, status: 'active' }).lean();
    if (!connection) {
      throw new AppError('You are not connected with that student.', 403, 'NOT_CONNECTED');
    }
    studentProfile = await User.findById(studentId).select('name email').lean();
    studentIds = [studentId];
  } else if (classId) {
    const result = await getStudentsInClass(teacherUser, classId);
    classDoc = result.classDoc;
    studentIds = await filterStudentIdsByGrade(result.studentIds, grade);
  } else {
    const connected = await getConnectedStudentIds(teacherUser);
    studentIds = await filterStudentIdsByGrade(connected, grade);
  }

  const totalStudents = studentIds.length;
  const activeClasses = await Class.countDocuments({ teacher: teacherUser._id, isActive: true });

  if (totalStudents === 0) {
    return {
      scope: studentId ? 'student' : classId ? 'class' : 'overview',
      classDoc,
      studentProfile,
      summary: {
        totalStudents: 0,
        activeClasses,
        averagePerformance: null,
        quizzesConducted: 0,
        completionRate: null,
        studentsNeedingAttention: 0,
      },
      subjectBreakdown: [],
      chapterBreakdown: [],
      scoreDistribution: scoreDistribution([]),
      progressOverTime: [],
      weakAreas: emptyWeakStrong(),
      strongAreas: emptyWeakStrong(),
      classComparison: [],
      studentComparison: [],
    };
  }

  const records = applyDateRange(await getAttemptRecordsForStudents(studentIds), dateRange);

  const subjectBreakdown = bySubject(records);

  // Always computed globally, across every subject the students have
  // attempted — the frontend filters this by subject client-side (e.g.
  // when a Subject performance bar is clicked) rather than requesting a
  // re-scoped version from the server. Every item now carries its own
  // subjectId (see analyticsMath.byChapter), which is exactly what makes
  // that client-side filtering possible.
  const chapterBreakdown = byChapter(records);

  // Weak/strong are computed independently at BOTH the subject and
  // chapter level and returned side by side — previously this coupled
  // weak and strong to a single shared "granularity" decision (chapter
  // if it had ANY signal, else subject), which meant the Strong list
  // could go empty just because the Weak list happened to have
  // chapter-level entries, even when a subject was clearly strong
  // overall. Showing both levels always avoids that entirely.
  const subjectClassification = classifyStrengthAndWeakness(subjectBreakdown);
  const chapterClassification = classifyStrengthAndWeakness(chapterBreakdown);

  const stats = overallStats(records);
  const completionRate = await getCompletionRate(teacherUser, studentIds);
  const studentsNeedingAttention = studentId ? null : countStudentsNeedingAttention(studentIds, records);

  let studentComparison = [];
  if (!studentId) {
    const byStudent = new Map();
    records.forEach((r) => {
      const key = String(r.student);
      if (!byStudent.has(key)) byStudent.set(key, []);
      byStudent.get(key).push(r);
    });
    const students = await User.find({ _id: { $in: studentIds } }).select('name email').lean();
    const studentById = new Map(students.map((s) => [String(s._id), s]));
    studentComparison = studentIds.map((id) => {
      const studentStats = overallStats(byStudent.get(String(id)) || []);
      const info = studentById.get(String(id));
      return {
        studentId: id,
        name: info?.name || 'Unknown student',
        quizzesAttempted: studentStats.totalQuizzes,
        averagePercentage: studentStats.weightedAccuracyPercentage,
      };
    });
    studentComparison.sort((a, b) => (b.averagePercentage || -1) - (a.averagePercentage || -1));
  }

  const classComparison = !studentId && !classId ? await getClassComparison(teacherUser, dateRange, grade) : [];

  return {
    scope: studentId ? 'student' : classId ? 'class' : 'overview',
    classDoc,
    studentProfile,
    summary: {
      totalStudents,
      activeClasses,
      averagePerformance: stats.weightedAccuracyPercentage,
      quizzesConducted: stats.totalQuizzes,
      completionRate,
      studentsNeedingAttention,
    },
    subjectBreakdown,
    chapterBreakdown,
    scoreDistribution: scoreDistribution(records),
    progressOverTime: progressOverTime(records),
    weakAreas: { subjects: subjectClassification.weak, chapters: chapterClassification.weak },
    strongAreas: { subjects: subjectClassification.strong, chapters: chapterClassification.strong },
    classComparison,
    studentComparison,
  };
}

module.exports = { getTeacherAnalytics, VALID_GRADES };
