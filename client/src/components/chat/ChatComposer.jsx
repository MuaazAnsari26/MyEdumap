import React, { useState } from 'react';
import Button from '../common/Button';

export default function ChatComposer({ onSend, isSending, placeholder = 'Type a message…' }) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-4)', borderTop: '1px solid var(--line)' }}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          padding: '0.65rem 0.9rem',
          border: '1px solid var(--line-strong)',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          maxHeight: 100,
        }}
      />
      <Button onClick={handleSend} isLoading={isSending} disabled={!value.trim()}>
        Send
      </Button>
    </div>
  );
}
