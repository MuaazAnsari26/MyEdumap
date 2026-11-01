import React, { useEffect, useState } from 'react';
import curriculumService from '../../services/curriculumService';
import classService from '../../services/classService';
import connectionService from '../../services/connectionService';
import analyticsService from '../../services/analyticsService';
import aiService from '../../services/aiService';
import MarkdownMessage from '../../components/chat/MarkdownMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FilterBar from '../../components/analytics/FilterBar';
import MetricCard from '../../components/analytics/MetricCard';
import TrendLineChart from '../../components/analytics/TrendLineChart';
import BreakdownBarChart from '../../components/analytics/BreakdownBarChart';
import ScoreDistributionDonut from '../../components/analytics/ScoreDistributionDonut';
import WeakStrongLists from '../../components/analytics/WeakStrongLists';
import Button from '../../components/common/Button';

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '30d', label: 'Last 30 days' },
  { value: '7d', label: 'Last 7 days' },
];

const GRADE_OPTIONS = [
  { value: 'all', label: 'All grades' },
  { value: '10th CBSE', label: '10th CBSE only' },
  { value: '12th CBSE', label: '12th CBSE only' },
];

export default function TeacherAnalytics() {
  const [classes, setClasses] = useState([]);
  const [connections, setConnections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [grade, setGrade] = useState('all');

  // Purely a client-side view filter for the Chapter performance chart —
  // deliberately NOT sent to the server and NOT in the data-fetch effect's
  // dependency array. Chapter breakdown is always fetched in full (every
  // subject at once, see teacherAnalyticsService.js); clicking a Subject
  // performance bar, or picking a subject here, just filters the array
  // already sitting in `data` — instant, no reload, no spinner.
  const [chapterViewSubjectId, setChapterViewSubjectId] = useState('');

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [insight, setInsight] = useState(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState(null);

  useEffect(() => {
    classService.listMyClasses().then(setClasses).catch(() => setClasses([]));
    connectionService.getConnections().then(setConnections).catch(() => setConnections([]));
    // Fetch subjects across BOTH grades — a teacher's connected students
    // can be 10th or 12th, and this filter previously only ever offered
    // 10th CBSE subjects.
    Promise.all([curriculumService.getSubjects('10th CBSE'), curriculumService.getSubjects('12th CBSE')])
      .then(([a, b]) => setSubjects([...a.subjects, ...b.subjects]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setInsight(null); // a stale insight from a different filter selection would be misleading
    setInsightError(null);
    analyticsService
      .getTeacherAnalytics({
        classId: classId || undefined,
        studentId: studentId || undefined,
        dateRange,
        grade,
      })
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
  }, [classId, studentId, dateRange, grade]);

  // Resetting this is cheap and correct whenever the underlying dataset
  // changes — a subject that was being viewed may no longer be relevant
  // (or may not even exist) in a different class/student/date scope.
  useEffect(() => {
    setChapterViewSubjectId('');
  }, [classId, studentId, dateRange, grade]);

  const chapterBreakdownForView = chapterViewSubjectId
    ? (data?.chapterBreakdown || []).filter((c) => c.subjectId === chapterViewSubjectId)
    : data?.chapterBreakdown || [];

  const handleGetInsight = async () => {
    setIsLoadingInsight(true);
    setInsightError(null);
    try {
      const result = await aiService.getTeachingInsight({
        classId: classId || undefined,
        studentId: studentId || undefined,
        dateRange,
        grade,
      });
      setInsight(result.insightText);
    } catch (err) {
      setInsightError(err.friendlyMessage);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const handleClassChange = (value) => {
    setClassId(value);
    setStudentId(''); // selecting a class clears any individual student drill-down
  };

  const handleStudentChange = (value) => {
    setStudentId(value);
    if (value) setClassId(''); // an individual student report takes precedence over class scope
  };

  const scopeLabel =
    data?.scope === 'student'
      ? `Individual report — ${data.studentProfile?.name}`
      : data?.scope === 'class'
      ? `Class report — ${data.classDoc?.name}`
      : grade !== 'all'
      ? `${grade} overview`
      : 'All classes overview';

  return (
    <div>
      <span className="eyebrow">Analytics</span>
      <h2>{scopeLabel}</h2>

      <FilterBar
        filters={[
          {
            id: 'grade',
            label: 'Grade',
            value: grade,
            onChange: setGrade,
            options: GRADE_OPTIONS,
          },
          {
            id: 'class',
            label: 'Class',
            value: classId,
            onChange: handleClassChange,
            options: [{ value: '', label: 'All classes' }, ...classes.map((c) => ({ value: c._id, label: c.name }))],
          },
          {
            id: 'student',
            label: 'Student',
            value: studentId,
            onChange: handleStudentChange,
            options: [
              { value: '', label: 'All students' },
              ...connections.map((c) => ({ value: c.student._id, label: `${c.student.name}${c.student.grade ? ` (${c.student.grade})` : ''}` })),
            ],
          },
          {
            id: 'subject',
            label: 'Subject (chapter view)',
            value: chapterViewSubjectId,
            onChange: setChapterViewSubjectId,
            options: [{ value: '', label: 'All subjects' }, ...subjects.map((s) => ({ value: s._id, label: `${s.name} (${s.grade})` }))],
          },
          {
            id: 'dateRange',
            label: 'Date range',
            value: dateRange,
            onChange: setDateRange,
            options: DATE_RANGE_OPTIONS,
          },
        ]}
      />

      {grade !== 'all' && studentId && (
        <p style={{ fontSize: '0.8rem', color: 'var(--slate-light)', marginTop: -8, marginBottom: 'var(--space-4)' }}>
          The grade filter doesn't apply to an individual student's report — they're already exactly one grade.
        </p>
      )}

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {isLoading ? (
        <LoadingSpinner label="Crunching the numbers…" />
      ) : !data || data.summary.totalStudents === 0 ? (
        <div className="empty-state">
          <h4>No students in this scope yet</h4>
          <p style={{ margin: 0 }}>Connect with students or add them to a class to see analytics here.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
            <MetricCard label="Total students" value={data.summary.totalStudents} />
            <MetricCard label="Active classes" value={data.summary.activeClasses} />
            <MetricCard label="Average performance" value={data.summary.averagePerformance} suffix="%" />
            <MetricCard label="Quizzes conducted" value={data.summary.quizzesConducted} />
            <MetricCard label="Completion rate" value={data.summary.completionRate} suffix="%" />
            {data.summary.studentsNeedingAttention !== null && (
              <MetricCard label="Needs attention" value={data.summary.studentsNeedingAttention} />
            )}
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-6)', background: 'var(--sky-light)', border: '1px solid #bfd6e9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div>
                <h4 style={{ marginBottom: 'var(--space-2)' }}>AI teaching insight</h4>
                {!insight && !insightError && (
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>
                    Get a short, AI-generated interpretation of the numbers above for this exact selection.
                  </p>
                )}
                {insightError && <div style={{ color: 'var(--brick)', fontSize: '0.88rem' }}>{insightError}</div>}
                {insight && (
                  <div style={{ color: 'var(--ink-soft)' }}>
                    <MarkdownMessage content={insight} />
                  </div>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={handleGetInsight} isLoading={isLoadingInsight}>
                {insight ? 'Regenerate' : 'Get AI insight'}
              </Button>
            </div>
          </div>

          {data.scope === 'overview' && data.classComparison.length > 0 && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <BreakdownBarChart
                data={data.classComparison.map((c) => ({
                  id: c.classId,
                  label: c.className,
                  percentage: c.averagePercentage || 0,
                  correct: 0,
                  total: c.studentCount,
                }))}
                title="Class comparison"
                emptyMessage="No classes yet."
                tooltipFormatter={(value, name, props) => [`${value}% average (${props.payload.total} students)`, props.payload.label]}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
            <TrendLineChart data={data.progressOverTime} title="Performance trend" />
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
                emptyMessage="No chapter-tagged quiz data yet for this selection."
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

          {data.studentComparison.length > 0 && (
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              <h4 style={{ marginBottom: 'var(--space-4)' }}>Student comparison</h4>
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {data.studentComparison.map((s) => (
                  <div
                    key={s.studentId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{s.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-light)' }}>{s.quizzesAttempted} quizzes attempted</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <span className="mono" style={{ fontWeight: 700, color: s.averagePercentage >= 60 ? 'var(--route-dark)' : s.averagePercentage === null ? 'var(--slate-light)' : 'var(--brick)' }}>
                        {s.averagePercentage !== null ? `${s.averagePercentage}%` : 'No attempts'}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => handleStudentChange(s.studentId)}>
                        View report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <WeakStrongLists weak={data.weakAreas} strong={data.strongAreas} />
        </>
      )}
    </div>
  );
}
