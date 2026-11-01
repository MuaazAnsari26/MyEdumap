import React, { useState } from 'react';
import Button from './Button';

export default function KeyEntryForm({ placeholder, buttonLabel, onSubmit }) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!value.trim()) {
      setError('Please enter a key.');
      return;
    }
    setIsSubmitting(true);
    try {
      const message = await onSubmit(value.trim());
      setSuccess(message || 'Done.');
      setValue('');
    } catch (err) {
      setError(err.friendlyMessage || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 220px' }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          style={{
            width: '100%',
            padding: '0.7rem 0.85rem',
            border: '1px solid var(--line-strong)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
          }}
        />
        {error && <div className="field-error">{error}</div>}
        {success && <div style={{ color: 'var(--route-dark)', fontSize: '0.82rem', marginTop: 'var(--space-2)' }}>{success}</div>}
      </div>
      <Button type="submit" isLoading={isSubmitting}>
        {buttonLabel}
      </Button>
    </form>
  );
}
