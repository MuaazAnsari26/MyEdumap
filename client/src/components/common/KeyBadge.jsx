import React, { useState } from 'react';

export default function KeyBadge({ label, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail in insecure contexts / older browsers;
      // fail silently rather than throwing an error at the user for a
      // non-critical convenience action.
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        background: 'var(--paper-alt)',
        border: '1px dashed var(--line-strong)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
      }}
    >
      <div>
        <div style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>{label}</div>
        <div className="mono" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--route-dark)' }}>
          {value}
        </div>
      </div>
      <button type="button" className="btn btn-outline btn-sm" onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
