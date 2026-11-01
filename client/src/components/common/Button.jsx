import React from 'react';

export default function Button({
  children,
  variant = 'primary', // primary | marigold | outline | ghost
  size = 'md', // md | sm
  isLoading = false,
  disabled = false,
  block = false,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? 'Please wait…' : children}
    </button>
  );
}
