const asyncHandler = require('../utils/asyncHandler');
const { getStudentAnalytics } = require('../services/analytics/studentAnalyticsService');
const { getTeacherAnalytics } = require('../services/analytics/teacherAnalyticsService');

const getMyAnalytics = asyncHandler(async (req, res) => {
  const { dateRange } = req.query;
  const data = await getStudentAnalytics(req.user, { dateRange });
  res.status(200).json({ success: true, data });
});

const getTeacherAnalyticsHandler = asyncHandler(async (req, res) => {
  const { classId, studentId, dateRange, grade } = req.query;
  const data = await getTeacherAnalytics(req.user, { classId, studentId, dateRange, grade });
  res.status(200).json({ success: true, data });
});

module.exports = { getMyAnalytics, getTeacherAnalyticsHandler };
