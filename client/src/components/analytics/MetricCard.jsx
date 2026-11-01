import React from 'react';

// `trendDelta` is null when there wasn't enough historical data to
// compute a genuine comparison — in that case we simply omit the badge
// rather than showing a fake "0%" or hiding the uncertainty.
export default function MetricCard({ label, value, suffix = '', trendDelta = null, trendLabel = 'vs earlier quizzes' }) {
  const hasValue = value !== null && value !== undefined;
  const isPositive = trendDelta !== null && trendDelta > 0;
  const isNegative = trendDelta !== null && trendDelta < 0;

  return (
    <div className="card">
      <div style={{ fontSize: '0.8rem', color: 'var(--slate)', marginBottom: 'var(--space-2)' }}>{label}</div>
      <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ink)' }}>
        {hasValue ? `${value}${suffix}` : '—'}
      </div>
      {trendDelta !== null && (
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            marginTop: 'var(--space-2)',
            color: isPositive ? 'var(--route-dark)' : isNegative ? 'var(--brick)' : 'var(--slate-light)',
          }}
        >
          {isPositive ? '↑' : isNegative ? '↓' : '—'} {Math.abs(trendDelta)}
          {suffix} <span style={{ color: 'var(--slate-light)', fontWeight: 400 }}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
