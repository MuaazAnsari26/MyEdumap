import React from 'react';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', marginTop: 'var(--space-9)', padding: 'var(--space-7) 0' }}>
      <div
        className="container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 'var(--space-6)',
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            EduMap
          </div>
          <p style={{ fontSize: '0.88rem' }}>
            A guided route from curriculum to mastery — built for CBSE students and the teachers who connect with them.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--slate)' }}>
              Students
            </h4>
            <p style={{ fontSize: '0.88rem', margin: 0 }}>
              <a href="/register/student">Create account</a>
              <br />
              <a href="/login/student">Log in</a>
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--slate)' }}>
              Teachers
            </h4>
            <p style={{ fontSize: '0.88rem', margin: 0 }}>
              <a href="/register/teacher">Create account</a>
              <br />
              <a href="/login/teacher">Log in</a>
            </p>
          </div>
        </div>
      </div>
      <div className="container" style={{ marginTop: 'var(--space-6)', fontSize: '0.78rem', color: 'var(--slate-light)' }}>
        © {new Date().getFullYear()} EduMap. Built for real classrooms, not demos.
      </div>
    </footer>
  );
}
