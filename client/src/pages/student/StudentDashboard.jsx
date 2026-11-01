import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import quizService from '../../services/quizService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Shows the student's real profile, connection key, and quiz activity
// summary. Full breakdowns (charts, weak-area detection, trends) live on
// the dedicated Progress page — this links there instead of duplicating it.
export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [userData, attemptData] = await Promise.all([
          authService.fetchCurrentUser(),
          quizService.listAttempts(),
        ]);
        if (mounted) {
          setProfile(userData.profile);
          setAttempts(attemptData);
        }
      } catch (err) {
        if (mounted) setError(err.friendlyMessage);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const quizzesAttempted = attempts?.length ?? 0;
  const averagePercentage =
    attempts && attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : null;

  return (
    <div>
      <span className="eyebrow">Student dashboard</span>
      <h2>Welcome, {user?.name?.split(' ')[0]}</h2>
      <p style={{ marginBottom: 'var(--space-7)' }}>Here’s where your route through EduMap begins.</p>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {isLoading ? (
        <LoadingSpinner label="Loading your profile…" />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-5)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Grade</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                {profile?.grade || '—'}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Connected teachers</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                {profile?.connectedTeacherCount ?? 0}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Classes joined</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                {profile?.classCount ?? 0}
              </div>
            </div>
            <div className="card" style={{ background: 'var(--paper-alt)', border: '1px dashed var(--line-strong)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Your connection key</div>
              <div className="mono" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--route-dark)' }}>
                {profile?.connectionKey || '—'}
              </div>
            </div>
          </div>

          {quizzesAttempted === 0 ? (
            <div className="empty-state" style={{ marginBottom: 'var(--space-5)' }}>
              <h4>No quizzes attempted yet</h4>
              <p style={{ margin: 0 }}>
                <Link to="/student/quizzes">Generate a practice quiz</Link> to get started.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--space-5)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <div className="card">
                <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Quizzes attempted</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                  {quizzesAttempted}
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Average score</div>
                <div
                  className="mono"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: averagePercentage >= 60 ? 'var(--route-dark)' : 'var(--brick)',
                  }}
                >
                  {averagePercentage}%
                </div>
              </div>
            </div>
          )}

          {quizzesAttempted > 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ margin: '0 0 var(--space-3)' }}>
                See subject, chapter, and topic-level breakdowns, plus your score trend over time.
              </p>
              <Link to="/student/progress" className="btn btn-outline btn-sm">
                View full progress report
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
