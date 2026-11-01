const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const StudentProfile = require('../models/StudentProfile');
const resourceService = require('../services/resources/resourceService');

// Same principle as curriculum: a student's grade is resolved server-side
// from their profile, never trusted from the request, so resources can't
// be browsed outside a student's own course.
const getResources = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    const profile = await StudentProfile.findOne({ user: req.user._id }).lean();
    if (!profile) {
      throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    }
    const resources = await resourceService.listResourcesForStudent(profile.grade, {
      subjectId: req.query.subjectId,
      chapterId: req.query.chapterId,
    });
    return res.status(200).json({ success: true, data: { grade: profile.grade, resources } });
  }

  // Teacher viewing their own uploads.
  const resources = await resourceService.listResourcesForTeacher(req.user._id);
  return res.status(200).json({ success: true, data: { resources } });
});

const createResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.createResource(req.user, req.body, req.file);
  res.status(201).json({ success: true, message: 'Resource added.', data: { resource } });
});

const removeResource = asyncHandler(async (req, res) => {
  await resourceService.deleteResource(req.user, req.params.resourceId);
  res.status(200).json({ success: true, message: 'Resource removed.' });
});

module.exports = { getResources, createResource, removeResource };
