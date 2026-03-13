import React from 'react';

export default function SectionHeader({ title, subtitle, className = '' }) {
  return (
    <div className={`section-header ${className}`} style={{ marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.2rem' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
  );
}
