const { getAttemptRecordsForStudents } = require('./attemptRecords');
const {
  bySubject,
  byChapter,
  byTopic,
  overallStats,
  progressOverTime,
  recentTrendDelta,
  classifyStrengthAndWeakness,
  scoreDistribution,
} = require('./analyticsMath');

function applyDateRange(records, dateRange) {
  if (!dateRange || dateRange === 'all') return records;

  const now = Date.now();
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : null;
  if (!days) return records;

  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return records.filter((r) => new Date(r.submittedAt).getTime() >= cutoff);
}

// Note: no subjectId parameter here — chapter (and topic) breakdown are
// always computed in full, across every subject the student has
// attempted. Subject-scoping the Chapter performance chart is a purely
// client-side concern (see StudentProgress.jsx's chapterViewSubjectId):
// clicking a Subject performance bar filters the already-fetched
// chapterBreakdown array instantly, with no server round-trip. This
// mirrors the identical architecture used for teacher analytics.
async function getStudentAnalytics(studentUser, { dateRange } = {}) {
  const allRecords = await getAttemptRecordsForStudents([studentUser._id]);
  const dateFiltered = applyDateRange(allRecords, dateRange);

  const subjectBreakdown = bySubject(dateFiltered);
  const chapterBreakdown = byChapter(dateFiltered);
  const topicBreakdown = byTopic(dateFiltered);

  // Computed independently, not coupled to a single "best granularity"
  // choice — see the equivalent fix in teacherAnalyticsService.js for
  // why coupling weak and strong to the same source was a bug (a strong
  // subject could disappear just because chapter data happened to have
  // weak entries).
  const subjectClassification = classifyStrengthAndWeakness(subjectBreakdown);
  const chapterClassification = classifyStrengthAndWeakness(chapterBreakdown);

  return {
    overall: overallStats(dateFiltered),
    trendDelta: recentTrendDelta(dateFiltered),
    progressOverTime: progressOverTime(dateFiltered),
    subjectBreakdown,
    chapterBreakdown,
    topicBreakdown,
    scoreDistribution: scoreDistribution(dateFiltered),
    weakAreas: { subjects: subjectClassification.weak, chapters: chapterClassification.weak },
    strongAreas: { subjects: subjectClassification.strong, chapters: chapterClassification.strong },
  };
}

module.exports = { getStudentAnalytics, applyDateRange };
