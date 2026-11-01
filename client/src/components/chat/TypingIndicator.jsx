import React from 'react';

export default function TypingIndicator({ label = 'Thinking…' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 'var(--space-3)' }} role="status" aria-live="polite">
      <div
        style={{
          padding: '0.6rem 0.9rem',
          borderRadius: '14px 14px 14px 4px',
          background: 'var(--paper-alt)',
          color: 'var(--slate)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span className="typing-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
        {label}
        <style>{`
          .typing-dots { display: inline-flex; gap: 3px; }
          .typing-dots span {
            width: 5px; height: 5px; border-radius: 50%;
            background: var(--slate-light);
            animation: typing-bounce 1.2s infinite ease-in-out;
          }
          .typing-dots span:nth-child(2) { animation-delay: 0.15s; }
          .typing-dots span:nth-child(3) { animation-delay: 0.3s; }
          @keyframes typing-bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
            30% { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
