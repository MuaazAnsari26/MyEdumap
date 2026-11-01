import React from 'react';

export default function MessageBubble({ content, isMine, timestamp, isError }) {
  return (
    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 'var(--space-3)' }}>
      <div
        style={{
          maxWidth: '75%',
          padding: '0.6rem 0.9rem',
          borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isError ? 'var(--brick-light)' : isMine ? 'var(--route)' : 'var(--paper-alt)',
          color: isError ? 'var(--brick)' : isMine ? '#fff' : 'var(--ink)',
          fontSize: '0.92rem',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
        {timestamp && (
          <div
            style={{
              fontSize: '0.68rem',
              marginTop: 4,
              opacity: 0.7,
              textAlign: isMine ? 'right' : 'left',
            }}
          >
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}
