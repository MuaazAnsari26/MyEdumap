import React from 'react';

export default function LoadingSpinner({ label = 'Loading…', size = 28 }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-7) 0',
        color: 'var(--slate)',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        style={{ animation: 'spin 0.9s linear infinite' }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="var(--route)"
          strokeWidth="4"
          strokeDasharray="90 60"
          strokeLinecap="round"
        />
      </svg>
      <span style={{ fontSize: '0.85rem' }}>{label}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
