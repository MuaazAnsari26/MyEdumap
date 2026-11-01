import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// Color-codes each bar by performance band so a teacher or student can
// scan the chart at a glance without reading every number — not an AI
// judgment, just a fixed, documented threshold matching the weak/strong
// classification used elsewhere.
function colorForPercentage(pct) {
  if (pct < 50) return '#b03d34'; // brick — weak
  if (pct < 75) return '#d99b0c'; // marigold — middling
  return '#2f6b4f'; // route green — strong
}

export default function BreakdownBarChart({
  data,
  title,
  emptyMessage = 'No data available yet for this breakdown.',
  idKey = 'id',
  labelKey = 'label',
  valueKey = 'percentage',
  tooltipFormatter,
  onBarClick,
}) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        {title && <h4 style={{ marginBottom: 'var(--space-4)' }}>{title}</h4>}
        <div className="empty-state">
          <p style={{ margin: 0 }}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0));
  const defaultFormatter = (value, name, props) => [`${value}% (${props.payload.correct}/${props.payload.total})`, 'Accuracy'];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        {title && <h4 style={{ marginBottom: 'var(--space-2)' }}>{title}</h4>}
        {onBarClick && <span style={{ fontSize: '0.72rem', color: 'var(--slate-light)' }}>Click a bar to drill in</span>}
      </div>
      <ResponsiveContainer width="100%" height={Math.max(180, sorted.length * 42)}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcdfd5" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#5b6472' }} axisLine={{ stroke: '#dcdfd5' }} tickLine={false} />
          <YAxis
            type="category"
            dataKey={labelKey}
            width={120}
            tick={{ fontSize: 12, fill: '#1e2a44' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip formatter={tooltipFormatter || defaultFormatter} contentStyle={{ borderRadius: 8, border: '1px solid #dcdfd5', fontSize: '0.85rem' }} />
          <Bar
            dataKey={valueKey}
            radius={[0, 6, 6, 0]}
            barSize={20}
            onClick={onBarClick ? (entry) => onBarClick(entry) : undefined}
            style={onBarClick ? { cursor: 'pointer' } : undefined}
          >
            {sorted.map((entry) => (
              <Cell key={entry[idKey]} fill={colorForPercentage(entry[valueKey] || 0)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
