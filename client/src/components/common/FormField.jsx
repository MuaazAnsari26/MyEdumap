import React from 'react';

export default function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  as = 'input', // 'input' | 'select'
  options = [], // for select
  ...rest
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {as === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={onChange}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
      )}
      {error && (
        <div className="field-error" id={`${id}-error`}>
          {error}
        </div>
      )}
      {!error && hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}
