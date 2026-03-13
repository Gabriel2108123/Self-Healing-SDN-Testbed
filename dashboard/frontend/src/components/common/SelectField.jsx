import React from 'react';

/**
 * Reusable dropdown input.
 */
export default function SelectField({ label, options, value, onChange, disabled = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
      {label && <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>}
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          padding: '0.55rem 0.75rem',
          borderRadius: 'var(--r-sm)',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontFamily: 'var(--font)',
          fontSize: '0.9rem',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
