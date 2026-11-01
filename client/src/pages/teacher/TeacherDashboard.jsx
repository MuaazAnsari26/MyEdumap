import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import analyticsService from '../../services/analyticsService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Real profile + connection key, real quiz-conducted count (via the
// analytics overview), and honest conditional empty states — the class
// and analytics teasers only show when there genuinely is/isn't data,
// never a static message regardless of reality.
export default function TeacherDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [quizzesConducted, setQuizzesConducted] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [userData, analytics] = await Promise.all([
          authService.fetchCurrentUser(),
          analyticsService.getTeacherAnalytics({}).catch(() => null),
        ]);
        if (mounted) {
          setProfile(userData.profile);
          setQuizzesConducted(analytics?.summary?.quizzesConducted ?? 0);
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

  const hasClasses = (profile?.classCount ?? 0) > 0;

  return (
    <div>
      <span className="eyebrow">Teacher dashboard</span>
      <h2>Welcome, {user?.name?.split(' ')[0]}</h2>
      <p style={{ marginBottom: 'var(--space-7)' }}>Your classes and student insights will live here.</p>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {isLoading ? (
        <LoadingSpinner label="Loading your profile…" />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-5)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Total students</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                {profile?.connectedStudentCount ?? 0}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Active classes</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                {profile?.classCount ?? 0}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Quizzes conducted</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                {quizzesConducted ?? 0}
              </div>
            </div>
            <div className="card" style={{ background: 'var(--paper-alt)', border: '1px dashed var(--line-strong)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Your connection key</div>
              <div className="mono" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--route-dark)' }}>
                {profile?.connectionKey || '—'}
              </div>
            </div>
          </div>

          {!hasClasses && (
            <div className="empty-state" style={{ marginBottom: 'var(--space-5)' }}>
              <h4>You haven&rsquo;t created a class yet</h4>
              <p style={{ margin: 0 }}>Create your first class to start connecting with students.</p>
            </div>
          )}

          {quizzesConducted > 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ margin: '0 0 var(--space-3)' }}>
                See class comparisons, subject/chapter breakdowns, and weak-spot detection across your students.
              </p>
              <Link to="/teacher/analytics" className="btn btn-outline btn-sm">
                View full analytics
              </Link>
            </div>
          ) : (
            <div className="empty-state">
              <h4>No analytics available yet</h4>
              <p style={{ margin: 0 }}>Once students attempt quizzes, class and subject analytics will appear here.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
