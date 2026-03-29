import React from 'react';

/**
 * Reusable on/off toggle.
 */
export default function ToggleField({ label, checked, onChange, disabled = false, description }) {
  const handleClick = () => {
    if (!disabled && typeof onChange === 'function') onChange();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '1rem' }}>
      <label
        onClick={handleClick}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          userSelect: 'none',
        }}>
        <div style={{
          position: 'relative',
          width: '36px',
          height: '20px',
          background: checked ? 'var(--accent)' : 'var(--surface2)',
          borderRadius: '10px',
          border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
          transition: 'background 0.2s'
        }}>
          <div style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '18px' : '2px',
            width: '14px',
            height: '14px',
            background: checked ? '#000' : 'var(--text-muted)',
            borderRadius: '50%',
            transition: 'left 0.2s, background 0.2s'
          }} />
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500 }}>{label}</span>
      </label>
      {description && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{description}</span>}
    </div>
  );
}
