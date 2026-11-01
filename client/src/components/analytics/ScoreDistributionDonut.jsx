import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BUCKET_COLORS = ['#b03d34', '#d99b0c', '#2f5f8a', '#2f6b4f'];

export default function ScoreDistributionDonut({ data, title }) {
  const total = (data || []).reduce((sum, d) => sum + d.count, 0);

  if (!data || total === 0) {
    return (
      <div className="card">
        {title && <h4 style={{ marginBottom: 'var(--space-4)' }}>{title}</h4>}
        <div className="empty-state">
          <p style={{ margin: 0 }}>No completed quizzes yet to show a distribution.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {title && <h4 style={{ marginBottom: 'var(--space-4)' }}>{title}</h4>}
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((entry, idx) => (
              <Cell key={entry.label} fill={BUCKET_COLORS[idx % BUCKET_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value} quiz(zes)`, name]} contentStyle={{ borderRadius: 8, border: '1px solid #dcdfd5', fontSize: '0.85rem' }} />
          <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
