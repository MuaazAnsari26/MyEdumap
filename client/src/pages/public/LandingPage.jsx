import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import RouteLine from '../../components/common/RouteLine';

const HERO_POINTS = [
  { x: 8, y: 30, label: 'CURRICULUM', color: 'var(--sky)' },
  { x: 36, y: 10, label: 'QUIZ', color: 'var(--marigold)' },
  { x: 64, y: 26, label: 'PROGRESS', color: 'var(--route)' },
  { x: 92, y: 6, label: 'MASTERY', color: 'var(--ink)' },
];

const FEATURES = [
  {
    title: 'Structured CBSE curriculum',
    body: 'Every subject and chapter organized the way your syllabus actually is — 10th and 12th CBSE, built to expand.',
    color: 'var(--sky)',
  },
  {
    title: 'AI-generated & teacher-built quizzes',
    body: 'Practice with quizzes drawn from your exact chapter, or ones your teacher hand-built for your class.',
    color: 'var(--marigold-dark)',
  },
  {
    title: 'Real performance analytics',
    body: 'Subject, chapter, and topic-level breakdowns calculated from your actual attempts — not guesses.',
    color: 'var(--route)',
  },
  {
    title: 'A teacher who can actually see your progress',
    body: 'Connect with a teacher using a simple key. They see where you’re strong, and where you need help.',
    color: 'var(--ink)',
  },
  {
    title: 'AI doubt solver',
    body: 'Stuck on a concept at 11pm? Ask and get an explanation, without waiting for the next class.',
    color: 'var(--sky)',
  },
  {
    title: 'Class-level insight for teachers',
    body: 'Weak-topic detection across a whole class, so lesson planning follows the data, not a hunch.',
    color: 'var(--marigold-dark)',
  },
];

const HOW_IT_WORKS = {
  student: [
    'Register and verify your email',
    'Share your connection key with a teacher, or join a class',
    'Explore your curriculum and attempt quizzes',
    'Track progress and ask AI when you’re stuck',
  ],
  teacher: [
    'Register and create your first class',
    'Share your class key with students',
    'Generate or build quizzes, then assign them',
    'Review reports and get AI teaching insights',
  ],
};

export default function LandingPage() {
  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="container" style={{ paddingTop: 'var(--space-9)', paddingBottom: 'var(--space-6)' }}>
        <div style={{ maxWidth: 720 }}>
          <span className="eyebrow">Built for CBSE 10th &amp; 12th</span>
          <h1>
            A guided route from <em style={{ fontStyle: 'italic', color: 'var(--route)' }}>curriculum</em> to{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--marigold-dark)' }}>mastery</em>.
          </h1>
          <p style={{ fontSize: '1.15rem', maxWidth: 560 }}>
            EduMap connects students and teachers around a real curriculum, AI-generated quizzes, and performance
            data that’s actually true — no filler, no fake dashboards.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginTop: 'var(--space-6)' }}>
            <Link to="/register/student">
              <Button variant="primary">I’m a student</Button>
            </Link>
            <Link to="/register/teacher">
              <Button variant="marigold">I’m a teacher</Button>
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-5)', marginTop: 'var(--space-4)', fontSize: '0.85rem' }}>
            <Link to="/login/student">Student login →</Link>
            <Link to="/login/teacher">Teacher login →</Link>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-8)' }}>
          <RouteLine points={HERO_POINTS} height={200} />
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" style={{ background: 'var(--paper-alt)', padding: 'var(--space-9) 0' }}>
        <div className="container">
          <span className="eyebrow">What EduMap does</span>
          <h2 style={{ maxWidth: 640 }}>Everything routes back to real data</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--space-5)',
              marginTop: 'var(--space-7)',
            }}
          >
            {FEATURES.map((f) => (
              <div className="card" key={f.title} style={{ background: 'var(--paper-card)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 999, background: f.color, marginBottom: 'var(--space-4)' }} />
                <h4>{f.title}</h4>
                <p style={{ fontSize: '0.92rem', marginBottom: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how-it-works" className="container" style={{ padding: 'var(--space-9) 0' }}>
        <span className="eyebrow">How EduMap works</span>
        <h2 style={{ marginBottom: 'var(--space-7)' }}>Two routes, one map</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-7)' }}>
          <div>
            <h3 style={{ color: 'var(--route-dark)' }}>For students</h3>
            <ol style={{ padding: 0, listStyle: 'none', margin: 0 }}>
              {HOW_IT_WORKS.student.map((step, i) => (
                <li
                  key={step}
                  style={{
                    display: 'flex',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4) 0',
                    borderBottom: i < HOW_IT_WORKS.student.length - 1 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <span className="mono" style={{ color: 'var(--route)', fontWeight: 600 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ color: 'var(--ink-soft)' }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 style={{ color: 'var(--marigold-dark)' }}>For teachers</h3>
            <ol style={{ padding: 0, listStyle: 'none', margin: 0 }}>
              {HOW_IT_WORKS.teacher.map((step, i) => (
                <li
                  key={step}
                  style={{
                    display: 'flex',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4) 0',
                    borderBottom: i < HOW_IT_WORKS.teacher.length - 1 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <span className="mono" style={{ color: 'var(--marigold-dark)', fontWeight: 600 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ color: 'var(--ink-soft)' }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------------- AI + Progress ---------------- */}
      <section style={{ background: 'var(--ink)', color: '#fff', padding: 'var(--space-9) 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-7)' }}>
          <div>
            <span className="eyebrow" style={{ background: 'rgba(255,255,255,0.08)', color: '#e4efe8', border: '1px solid rgba(255,255,255,0.15)' }}>
              AI-powered, backend-verified
            </span>
            <h2 style={{ color: '#fff' }}>AI helps you learn. Math still does the math.</h2>
            <p style={{ color: '#c7cfda' }}>
              Quiz generation and doubt-solving run through AI — but every score, percentage, and trend on your
              dashboard is calculated by the backend from your real attempts. If AI is unavailable, EduMap falls
              back to your existing question bank rather than making something up.
            </p>
          </div>
          <div>
            <span className="eyebrow" style={{ background: 'rgba(255,255,255,0.08)', color: '#fbf0d9', border: '1px solid rgba(255,255,255,0.15)' }}>
              Progress tracking
            </span>
            <h2 style={{ color: '#fff' }}>See exactly where you stand.</h2>
            <p style={{ color: '#c7cfda' }}>
              Subject, chapter, and topic-level breakdowns — strong areas, weak areas, and how they’re trending
              over time. No dashboard filler. If you haven’t attempted a quiz yet, we’ll tell you that honestly.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="container text-center" style={{ padding: 'var(--space-9) 0' }}>
        <h2>Ready to plot your route?</h2>
        <p style={{ maxWidth: 480, margin: '0 auto var(--space-6)' }}>
          Whether you’re here to learn or to teach, your dashboard starts honest — real data only, from day one.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register/student">
            <Button variant="primary">Register as a student</Button>
          </Link>
          <Link to="/register/teacher">
            <Button variant="outline">Register as a teacher</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
