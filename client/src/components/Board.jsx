import React from 'react';

export default function Board({ calledNumbers }) {
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);
  const last    = calledNumbers[calledNumbers.length - 1];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)', gap: 3 }}>
      {numbers.map(n => {
        const called = calledNumbers.includes(n);
        const isLast = n === last;
        return (
          <div key={n} style={{
            aspectRatio: '1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 4,
            fontSize: '0.62rem', fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
            background: isLast  ? 'linear-gradient(135deg,#6c4ef5,#4f35d2)'
                      : called  ? 'rgba(108,78,245,0.25)'
                      : 'rgba(255,255,255,0.04)',
            color: isLast ? '#fff' : called ? '#a78bfa' : 'rgba(255,255,255,0.2)',
            border: isLast ? 'none'
                  : called ? '1px solid rgba(108,78,245,0.3)'
                  : '1px solid transparent',
            boxShadow: isLast ? '0 0 8px rgba(108,78,245,0.6)' : 'none',
            transform: isLast ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s',
          }}>
            {n}
          </div>
        );
      })}
    </div>
  );
}
