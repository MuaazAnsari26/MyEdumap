import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function TrendLineChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        {title && <h4 style={{ marginBottom: 'var(--space-4)' }}>{title}</h4>}
        <div className="empty-state">
          <p style={{ margin: 0 }}>Not enough quiz attempts yet to show a trend.</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((d, idx) => ({ ...d, index: idx, dateLabel: formatDate(d.date) }));

  return (
    <div className="card">
      {title && <h4 style={{ marginBottom: 'var(--space-4)' }}>{title}</h4>}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2f6b4f" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2f6b4f" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcdfd5" vertical={false} />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#5b6472' }} axisLine={{ stroke: '#dcdfd5' }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#5b6472' }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Score']}
            contentStyle={{ borderRadius: 8, border: '1px solid #dcdfd5', fontSize: '0.85rem' }}
          />
          <Area type="monotone" dataKey="percentage" stroke="#2f6b4f" strokeWidth={2} fill="url(#progressFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
