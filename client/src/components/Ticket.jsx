import React, { useState } from 'react';

export default function Ticket({ ticket }) {
  const [marked, setMarked] = useState(new Set());

  const toggle = (num) => {
    if (num === null) return;
    setMarked(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(9, 1fr)',
      gap: 3,
      background: 'rgba(0,0,0,0.2)',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.07)',
      padding: 4,
    }}>
      {ticket.map((row, rIdx) =>
        row.map((num, cIdx) => {
          const isMarked = marked.has(num);
          const isEmpty = num === null;
          return (
            <div
              key={`${rIdx}-${cIdx}`}
              onClick={() => toggle(num)}
              style={{
                aspectRatio: '1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 5,
                background: isEmpty ? 'transparent' : 'rgba(255,255,255,0.06)',
                border: isEmpty ? 'none' : '1px solid rgba(255,255,255,0.08)',
                cursor: isEmpty ? 'default' : 'pointer',
                userSelect: 'none',
              }}
            >
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                color: isMarked ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
                textDecoration: isMarked ? 'line-through' : 'none',
                textDecorationColor: 'white',
                textDecorationThickness: '2px',
              }}>
                {isEmpty ? '' : num}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
