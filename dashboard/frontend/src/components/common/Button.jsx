import React from 'react';

/**
 * Reusable styled button.
 * variants: 'primary', 'secondary', 'danger'
 */
export default function Button({ children, onClick, variant = 'primary', disabled = false, className = '' }) {
  let baseStyle = {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--r-sm)',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'opacity 0.2s',
    fontFamily: 'var(--font)',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
  };

  if (variant === 'primary') {
    baseStyle.background = 'var(--accent)';
    baseStyle.color = '#000';
  } else if (variant === 'danger') {
    baseStyle.background = 'var(--red-dim)';
    baseStyle.color = 'var(--red)';
    baseStyle.border = '1px solid var(--red)';
  } else {
    // secondary
    baseStyle.background = 'var(--surface2)';
    baseStyle.color = 'var(--text)';
    baseStyle.border = '1px solid var(--border)';
  }

  return (
    <button 
      onClick={disabled ? undefined : onClick}
      style={baseStyle}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}
