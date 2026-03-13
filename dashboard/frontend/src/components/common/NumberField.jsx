import React from 'react';

/**
 * Reusable numeric input.
 */
export default function NumberField({ label, value, min, max, onChange, disabled = false, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
      {label && <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>}
      <input 
        type="number"
        value={value} 
        min={min}
        max={max}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        style={{
          padding: '0.55rem 0.75rem',
          borderRadius: 'var(--r-sm)',
          background: 'var(--surface2)',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          color: 'var(--text)',
          fontFamily: 'var(--font)',
          fontSize: '0.9rem',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1
        }}
      />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}
