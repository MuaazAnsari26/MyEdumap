import React, { useEffect, useState } from 'react';
import analyticsService from '../../services/analyticsService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FilterBar from '../../components/analytics/FilterBar';
import MetricCard from '../../components/analytics/MetricCard';
import TrendLineChart from '../../components/analytics/TrendLineChart';
import BreakdownBarChart from '../../components/analytics/BreakdownBarChart';
import ScoreDistributionDonut from '../../components/analytics/ScoreDistributionDonut';
import WeakStrongLists from '../../components/analytics/WeakStrongLists';

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '30d', label: 'Last 30 days' },
  { value: '7d', label: 'Last 7 days' },
];

export default function StudentProgress() {
  const [dateRange, setDateRange] = useState('all');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Purely a client-side view filter for the Chapter performance chart —
  // never sent to the server. Chapter breakdown is always fetched in
  // full (every subject at once); clicking a Subject performance bar, or
  // picking a subject here, just filters the array already sitting in
  // `data` — instant, no reload, no spinner. Same architecture as the
  // teacher Analytics page.
  const [chapterViewSubjectId, setChapterViewSubjectId] = useState('');

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    analyticsService
      .getMyAnalytics({ dateRange })
      .then((d) => {
        if (mounted) setData(d);
      })
      .catch((err) => {
        if (mounted) setError(err.friendlyMessage);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [dateRange]);

  useEffect(() => {
    setChapterViewSubjectId('');
  }, [dateRange]);

  const chapterBreakdownForView = chapterViewSubjectId
    ? (data?.chapterBreakdown || []).filter((c) => c.subjectId === chapterViewSubjectId)
    : data?.chapterBreakdown || [];

  return (
    <div>
      <span className="eyebrow">Progress</span>
      <h2>Your performance</h2>

      <FilterBar
        filters={[
          {
            id: 'dateRange',
            label: 'Date range',
            value: dateRange,
            onChange: setDateRange,
            options: DATE_RANGE_OPTIONS,
          },
          {
            id: 'subject',
            label: 'Subject (chapter view)',
            value: chapterViewSubjectId,
            onChange: setChapterViewSubjectId,
            options: [
              { value: '', label: 'All subjects' },
              ...(data?.subjectBreakdown || []).map((s) => ({ value: s.id, label: s.label })),
            ],
          },
        ]}
      />

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {isLoading ? (
        <LoadingSpinner label="Crunching your quiz history…" />
      ) : !data || data.overall.totalQuizzes === 0 ? (
        <div className="empty-state">
          <h4>Complete some quizzes to unlock performance analytics</h4>
          <p style={{ margin: 0 }}>Once you've attempted a few quizzes, your progress will show up here.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
            <MetricCard label="Quizzes attempted" value={data.overall.totalQuizzes} />
            <MetricCard label="Overall accuracy" value={data.overall.weightedAccuracyPercentage} suffix="%" trendDelta={data.trendDelta} />
            <MetricCard label="Average per quiz" value={data.overall.averageScorePercentage} suffix="%" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
            <TrendLineChart data={data.progressOverTime} title="Score trend over time" />
            <ScoreDistributionDonut data={data.scoreDistribution} title="Score distribution" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
            <BreakdownBarChart
              data={data.subjectBreakdown}
              title="Subject performance"
              onBarClick={(entry) => setChapterViewSubjectId(entry.id)}
            />
            <div>
              <BreakdownBarChart
                data={chapterBreakdownForView}
                title={chapterViewSubjectId ? 'Chapter performance' : 'Chapter performance (all subjects)'}
                emptyMessage="No chapter-tagged quizzes yet for this selection."
                labelKey="chapterName"
                tooltipFormatter={(value, name, props) => [
                  `${value}% (${props.payload.correct}/${props.payload.total}) — ${props.payload.subjectName}`,
                  'Accuracy',
                ]}
              />
              {chapterViewSubjectId && (
                <button
                  type="button"
                  onClick={() => setChapterViewSubjectId('')}
                  style={{ background: 'none', border: 'none', color: 'var(--route)', cursor: 'pointer', fontSize: '0.8rem', marginTop: 'var(--space-2)', padding: 0 }}
                >
                  ← Clear subject filter
                </button>
              )}
            </div>
          </div>

          <WeakStrongLists weak={data.weakAreas} strong={data.strongAreas} />
        </>
      )}
    </div>
  );
}
