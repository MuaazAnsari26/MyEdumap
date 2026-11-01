const asyncHandler = require('../utils/asyncHandler');
const { getTeachingInsight } = require('../services/ai/aiInsightService');

const getInsight = asyncHandler(async (req, res) => {
  const { classId, studentId, dateRange, grade } = req.query;
  const result = await getTeachingInsight(req.user, { classId, studentId, dateRange, grade });
  res.status(200).json({ success: true, data: result });
});

module.exports = { getInsight };
