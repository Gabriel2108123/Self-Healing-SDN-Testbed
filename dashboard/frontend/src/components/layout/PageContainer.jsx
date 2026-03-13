import React from 'react';

export default function PageContainer({ children }) {
  return (
    <div style={{
      maxWidth: '1600px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--gap)'
    }}>
      {children}
    </div>
  );
}
