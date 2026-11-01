// All functions here are pure (no DB, no AI) so they're trivially
// testable and reusable by both student-facing and teacher-facing
// analytics, which slice the same underlying attempt records differently.

function round(n) {
  return Math.round(n * 10) / 10;
}

// Groups every individual answer (across all attempts) by a key derived
// from its question metadata, and computes accuracy per group. Used for
// subject/chapter/topic breakdowns alike — just pass a different keyFn.
// `extraFieldsFn`, when given, attaches additional fields to a group the
// first time it's seen (e.g. tagging a chapter with its parent subject) —
// safe here because a chapter always belongs to exactly one subject by
// the data model, so every answer for that chapter agrees on the value.
function groupAnswersByKey(records, keyFn, labelFn, extraFieldsFn) {
  const groups = new Map(); // key -> { correct, total, label, ...extra }

  records.forEach((record) => {
    record.answers.forEach((answer) => {
      const key = keyFn(answer);
      if (key === null || key === undefined) return; // skip untagged answers
      if (!groups.has(key)) {
        groups.set(key, {
          correct: 0,
          total: 0,
          label: labelFn(answer),
          ...(extraFieldsFn ? extraFieldsFn(answer) : {}),
        });
      }
      const g = groups.get(key);
      g.total += 1;
      if (answer.isCorrect) g.correct += 1;
    });
  });

  return Array.from(groups.entries()).map(([key, g]) => ({
    id: key,
    ...g,
    percentage: g.total > 0 ? round((g.correct / g.total) * 100) : 0,
  }));
}

function bySubject(records) {
  return groupAnswersByKey(
    records,
    (a) => (a.subject ? String(a.subject._id || a.subject) : null),
    (a) => a.subject?.name || 'Unknown subject'
  );
}

// Every chapter entry is tagged with its parent subject's id and name —
// previously a chapter's label was just its bare name, which looked like
// a "floating" chapter with no subject when chapters from multiple
// subjects were mixed together in one unscoped breakdown. Now the label
// always shows both, and `subjectId` is exposed separately so the
// frontend can filter chapters by subject client-side without another
// server round-trip.
function byChapter(records) {
  return groupAnswersByKey(
    records,
    (a) => (a.chapter ? String(a.chapter._id || a.chapter) : null),
    (a) => {
      const chapterName = a.chapter?.name || 'Unknown chapter';
      const subjectName = a.subject?.name || 'Unknown subject';
      return `${chapterName} (${subjectName})`;
    },
    (a) => ({
      // Bare chapter name, for compact chart axis labels where the
      // combined "label" above reads as jumbled/overlapping text in a
      // narrow space — charts show this instead and put the subject in
      // the tooltip. List views (e.g. WeakStrongLists) use `label`.
      chapterName: a.chapter?.name || 'Unknown chapter',
      subjectId: a.subject ? String(a.subject._id || a.subject) : null,
      subjectName: a.subject?.name || 'Unknown subject',
    })
  );
}

function byTopic(records) {
  return groupAnswersByKey(
    records,
    (a) => a.topic || null,
    (a) => a.topic
  );
}

// Overall stats across a set of attempt records. Weighted percentage
// (total correct / total questions) is the honest "how are they really
// doing" number; the simple average of per-quiz percentages is what most
// people intuitively mean by "average score" — both are shown since they
// can legitimately differ (e.g. one very long weak quiz vs several short
// strong ones).
function overallStats(records) {
  if (records.length === 0) {
    return { totalQuizzes: 0, averageScorePercentage: null, weightedAccuracyPercentage: null };
  }

  const totalScore = records.reduce((sum, r) => sum + r.score, 0);
  const totalQuestions = records.reduce((sum, r) => sum + r.totalQuestions, 0);
  const averageScorePercentage = round(records.reduce((sum, r) => sum + r.percentage, 0) / records.length);
  const weightedAccuracyPercentage = totalQuestions > 0 ? round((totalScore / totalQuestions) * 100) : 0;

  return { totalQuizzes: records.length, averageScorePercentage, weightedAccuracyPercentage };
}

// Chronological series for a trend line chart.
function progressOverTime(records) {
  return records.map((r) => ({ date: r.submittedAt, percentage: r.percentage }));
}

// A genuine trend delta: compares the average of the most recent half of
// attempts against the earlier half. Returns null (not zero) when there
// isn't enough data for the comparison to mean anything — the frontend
// must treat null as "don't show a trend badge", never as "0% change".
function recentTrendDelta(records, minAttemptsRequired = 4) {
  if (records.length < minAttemptsRequired) return null;

  const midpoint = Math.floor(records.length / 2);
  const earlier = records.slice(0, midpoint);
  const recent = records.slice(midpoint);

  const avg = (arr) => arr.reduce((sum, r) => sum + r.percentage, 0) / arr.length;
  return round(avg(recent) - avg(earlier));
}

// Splits grouped breakdowns into strong/weak buckets using fixed,
// documented thresholds — not AI judgment. Requires a minimum sample size
// per group so a single lucky/unlucky question doesn't get labeled a
// "weak area".
function classifyStrengthAndWeakness(groups, { weakThreshold = 50, strongThreshold = 75, minSample = 2 } = {}) {
  const eligible = groups.filter((g) => g.total >= minSample);

  const weak = eligible.filter((g) => g.percentage < weakThreshold).sort((a, b) => a.percentage - b.percentage);
  let strong = eligible.filter((g) => g.percentage >= strongThreshold).sort((a, b) => b.percentage - a.percentage);

  // If nothing clears the absolute 75% bar, but there IS real data,
  // still surface the single best-performing group as "strong" —
  // relative to a value that only exists in comparison to others.
  // Without this, a student's genuinely best subject (say, 68%) shows up
  // nowhere, which reads as a bug ("how can nothing be strong?") rather
  // than the intended meaning ("nothing is *excellent* yet"). This
  // deliberately does NOT apply to `weak`: an empty weak list is a
  // correct, good-news result and shouldn't be forced to show something.
  if (strong.length === 0 && eligible.length > 0) {
    const best = [...eligible].sort((a, b) => b.percentage - a.percentage)[0];
    // Guard: don't call something "strong" just for being the
    // least-bad option — if even the best group is itself below the
    // weak threshold (e.g. everything is under 50%), showing nothing
    // here is more honest than mislabeling a 30% subject "strong".
    if (best.percentage >= weakThreshold) {
      strong = [best];
    }
  }

  return { weak, strong };
}

const SCORE_BUCKETS = [
  { label: '0-40%', min: 0, max: 40 },
  { label: '40-60%', min: 40, max: 60 },
  { label: '60-80%', min: 60, max: 80 },
  { label: '80-100%', min: 80, max: 101 },
];

function scoreDistribution(records) {
  return SCORE_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: records.filter((r) => r.percentage >= bucket.min && r.percentage < bucket.max).length,
  }));
}

module.exports = {
  bySubject,
  byChapter,
  byTopic,
  overallStats,
  progressOverTime,
  recentTrendDelta,
  classifyStrengthAndWeakness,
  scoreDistribution,
};
