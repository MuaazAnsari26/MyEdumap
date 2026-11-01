import React, { useState } from 'react';
import Button from './Button';

// direction: 'incoming' shows Accept/Deny; 'outgoing' shows Cancel.
export default function RequestCard({ person, createdAt, direction, onAccept, onReject, onCancel }) {
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        padding: 'var(--space-4) var(--space-5)',
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>{person?.name || 'Unknown user'}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)' }}>
          {person?.email} · Requested {new Date(createdAt).toLocaleDateString()}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {direction === 'incoming' ? (
          <>
            <Button size="sm" variant="primary" isLoading={busy} onClick={() => run(onAccept)}>
              Accept
            </Button>
            <Button size="sm" variant="outline" isLoading={busy} onClick={() => run(onReject)}>
              Deny
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" isLoading={busy} onClick={() => run(onCancel)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
