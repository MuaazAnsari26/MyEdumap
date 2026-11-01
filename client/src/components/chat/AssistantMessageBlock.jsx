import React from 'react';
import MarkdownMessage from './MarkdownMessage';

// Unlike MessageBubble (used for short human chat messages), AI replies
// can be long and structurally rich — headers, lists, equations. Cramming
// that into a narrow speech-bubble shape reads badly, so this renders as
// a full-width card instead, left-aligned, similar to how most AI chat
// products present assistant responses.
export default function AssistantMessageBlock({ content, timestamp }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <div
        style={{
          background: 'var(--paper-alt)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4) var(--space-5)',
        }}
      >
        <MarkdownMessage content={content} />
      </div>
      {timestamp && (
        <div style={{ fontSize: '0.7rem', color: 'var(--slate-light)', marginTop: 4 }}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}
