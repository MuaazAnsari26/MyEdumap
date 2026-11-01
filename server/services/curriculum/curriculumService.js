const Subject = require('../../models/Subject');
const Chapter = require('../../models/Chapter');
const AppError = require('../../utils/AppError');

async function listSubjectsForGrade(grade) {
  return Subject.find({ grade }).sort({ order: 1 }).lean();
}

async function listChaptersForSubject(subjectId) {
  const subject = await Subject.findById(subjectId).lean();
  if (!subject) {
    throw new AppError('Subject not found.', 404, 'SUBJECT_NOT_FOUND');
  }

  const chapters = await Chapter.find({ subject: subjectId }).sort({ order: 1 }).lean();
  return { subject, chapters };
}

module.exports = { listSubjectsForGrade, listChaptersForSubject };
