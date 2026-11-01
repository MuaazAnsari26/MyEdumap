import React from 'react';

// A generic horizontal filter bar — pass in an array of { id, label,
// value, onChange, options } and it lays them out consistently. Keeps
// the student and teacher analytics pages visually aligned without
// duplicating this layout code.
export default function FilterBar({ filters }) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        alignItems: 'flex-end',
        padding: 'var(--space-4) var(--space-5)',
        marginBottom: 'var(--space-6)',
      }}
    >
      {filters.map((f) => (
        <div key={f.id} style={{ minWidth: 160 }}>
          <label htmlFor={f.id} style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 'var(--space-2)' }}>
            {f.label}
          </label>
          <select
            id={f.id}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.7rem',
              border: '1px solid var(--line-strong)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              background: '#fff',
              color: 'var(--ink)',
            }}
          >
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
