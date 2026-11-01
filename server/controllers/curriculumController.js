const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const StudentProfile = require('../models/StudentProfile');
const curriculumService = require('../services/curriculum/curriculumService');

const VALID_GRADES = ['10th CBSE', '12th CBSE'];

// Students always see their own grade's curriculum, regardless of what
// (if anything) is passed as a query param — the backend decides this,
// not the client, so a student can't simply edit the URL to browse
// another grade's structure. Teachers may browse any valid grade.
async function resolveGradeForRequest(req) {
  if (req.user.role === 'student') {
    const profile = await StudentProfile.findOne({ user: req.user._id }).lean();
    if (!profile) {
      throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    }
    return profile.grade;
  }

  const { grade } = req.query;
  if (!grade || !VALID_GRADES.includes(grade)) {
    throw new AppError('A valid grade is required, e.g. "10th CBSE" or "12th CBSE".', 400, 'INVALID_GRADE');
  }
  return grade;
}

const getSubjects = asyncHandler(async (req, res) => {
  const grade = await resolveGradeForRequest(req);
  const subjects = await curriculumService.listSubjectsForGrade(grade);
  res.status(200).json({ success: true, data: { grade, subjects } });
});

const getChapters = asyncHandler(async (req, res) => {
  const { subject, chapters } = await curriculumService.listChaptersForSubject(req.params.subjectId);
  res.status(200).json({ success: true, data: { subject, chapters } });
});

module.exports = { getSubjects, getChapters };
