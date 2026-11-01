const AppError = require('../../utils/AppError');
const aiService = require('../ai/aiService');
const { getTeacherAnalytics } = require('../analytics/teacherAnalyticsService');

// The AI is only ever handed numbers the backend already calculated
// (spec section 28: "AI should NOT be used for basic mathematical
// calculations that the backend can perform reliably"). This function
// builds that summary; the AI's only job is to turn it into a short,
// readable teaching recommendation.
function buildInsightPrompt(analytics, scopeDescription) {
  const { summary, weakAreas, strongAreas } = analytics;

  const formatLines = (items, withCounts) =>
    items.length > 0
      ? items
          .slice(0, 5)
          .map((i) => (withCounts ? `- ${i.label}: ${i.percentage}% (${i.correct}/${i.total} correct)` : `- ${i.label}: ${i.percentage}%`))
          .join('\n')
      : 'None identified from the current data.';

  return `You are analyzing real, already-calculated performance data for a teacher on the EduMap platform. Do not invent, estimate, or recalculate any numbers - only interpret what is given below.

Scope: ${scopeDescription}
Total students in scope: ${summary.totalStudents}
Quizzes conducted: ${summary.quizzesConducted}
Average performance: ${summary.averagePerformance !== null ? `${summary.averagePerformance}%` : 'not available'}
Completion rate: ${summary.completionRate !== null ? `${summary.completionRate}%` : 'not available'}
${summary.studentsNeedingAttention !== null ? `Students needing attention (below 50% average): ${summary.studentsNeedingAttention}` : ''}

Weak subjects (below 50% accuracy):
${formatLines(weakAreas.subjects, true)}

Weak chapters (below 50% accuracy):
${formatLines(weakAreas.chapters, true)}

Strong subjects (75%+ accuracy):
${formatLines(strongAreas.subjects, false)}

Strong chapters (75%+ accuracy):
${formatLines(strongAreas.chapters, false)}

Write a short, encouraging but honest teaching recommendation in 2-4 sentences. Focus on what the teacher should spend more time on next, based only on the data above. Do not restate every number - write for a teacher who has already seen the dashboard and wants a brief interpretation, not a summary.`;
}

async function getTeachingInsight(teacherUser, { classId, studentId, dateRange, grade } = {}) {
  const analytics = await getTeacherAnalytics(teacherUser, { classId, studentId, dateRange, grade });

  if (analytics.summary.totalStudents === 0 || analytics.summary.quizzesConducted === 0) {
    throw new AppError(
      'There is not enough quiz data yet in this selection to generate a meaningful insight.',
      400,
      'INSUFFICIENT_DATA'
    );
  }

  const scopeDescription =
    analytics.scope === 'student'
      ? `an individual student (${analytics.studentProfile?.name || 'unknown'})`
      : analytics.scope === 'class'
      ? `a single class (${analytics.classDoc?.name || 'unknown'})`
      : "all of this teacher's connected students across all classes";

  const prompt = buildInsightPrompt(analytics, scopeDescription);

  let insightText;
  try {
    insightText = await aiService.generateTeachingInsight(prompt);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`AI teaching insight failed (${err.code || 'UNKNOWN'}): ${err.message}`);
    throw new AppError('AI analysis is currently unavailable. Please try again later.', 503, 'AI_UNAVAILABLE');
  }

  if (!insightText || !insightText.trim()) {
    throw new AppError('AI analysis is currently unavailable. Please try again later.', 503, 'AI_UNAVAILABLE');
  }

  return { insightText: insightText.trim(), generatedFrom: { scope: analytics.scope, summary: analytics.summary } };
}

module.exports = { getTeachingInsight };
