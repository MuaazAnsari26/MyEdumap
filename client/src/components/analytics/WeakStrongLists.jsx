import React from 'react';

function MiniList({ items, tone, emptyText }) {
  const color = tone === 'weak' ? 'var(--brick)' : 'var(--route-dark)';
  const bg = tone === 'weak' ? 'var(--brick-light)' : 'var(--route-light)';

  if (items.length === 0) {
    return <p style={{ fontSize: '0.82rem', color: 'var(--slate-light)', margin: 0 }}>{emptyText}</p>;
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: 'var(--space-2) var(--space-3)',
            background: bg,
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
          }}
        >
          <span>{item.label}</span>
          <span className="mono" style={{ fontWeight: 700, color }}>
            {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}

// Renders subject-level and chapter-level results side by side, always,
// for both the weak ("Needs attention") and strong side — these two
// granularities are computed independently on the backend now, so a
// subject can show up as strong even if no individual chapter has
// cleared the "strong" bar yet, and vice versa.
function AreaCard({ title, subjects, chapters, tone }) {
  return (
    <div className="card">
      <h4 style={{ marginBottom: 'var(--space-4)' }}>{title}</h4>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--slate-light)', marginBottom: 'var(--space-2)' }}>
          By subject
        </div>
        <MiniList
          items={subjects}
          tone={tone}
          emptyText={tone === 'weak' ? 'No weak subjects identified yet.' : 'No standout strong subjects yet.'}
        />
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--slate-light)', marginBottom: 'var(--space-2)' }}>
          By chapter
        </div>
        <MiniList
          items={chapters}
          tone={tone}
          emptyText={tone === 'weak' ? 'No weak chapters identified yet — try selecting a subject for a closer look.' : 'No standout strong chapters yet.'}
        />
      </div>
    </div>
  );
}

export default function WeakStrongLists({ weak, strong }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
      <AreaCard title="Needs attention" subjects={weak.subjects} chapters={weak.chapters} tone="weak" />
      <AreaCard title="Strong areas" subjects={strong.subjects} chapters={strong.chapters} tone="strong" />
    </div>
  );
}
