import React from 'react';

// The recurring visual motif: a dashed trail connecting labeled waypoints,
// echoing "EduMap" as a map of the learning journey. `points` is an array
// of { x, y, label, color } in a 0-100 coordinate space.
export default function RouteLine({ points, height = 220, showLabels = true }) {
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 100 40" width="100%" height={height} preserveAspectRatio="none" aria-hidden="true">
      <path d={path} fill="none" stroke="var(--ink)" strokeWidth="0.4" strokeDasharray="1.4 1.4" opacity="0.55" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="1.6" fill={p.color || 'var(--route)'} stroke="var(--paper)" strokeWidth="0.5" />
          {showLabels && p.label && (
            <text
              x={p.x}
              y={p.y - 3}
              textAnchor="middle"
              fontSize="2.6"
              fontFamily="var(--font-mono)"
              fill="var(--ink-soft)"
            >
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
