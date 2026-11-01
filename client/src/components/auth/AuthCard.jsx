import React from 'react';

export default function AuthCard({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 68px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-7) var(--space-4)',
        background:
          'radial-gradient(circle at 15% 20%, var(--route-light) 0%, transparent 40%), radial-gradient(circle at 85% 80%, var(--marigold-light) 0%, transparent 40%)',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-lg)' }}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 style={{ marginBottom: 'var(--space-2)' }}>{title}</h2>
        {subtitle && <p style={{ marginBottom: 'var(--space-6)' }}>{subtitle}</p>}
        {children}
        {footer && <div style={{ marginTop: 'var(--space-6)', fontSize: '0.88rem', textAlign: 'center' }}>{footer}</div>}
      </div>
    </div>
  );
}
