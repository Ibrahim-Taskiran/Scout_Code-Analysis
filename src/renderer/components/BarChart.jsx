import React from 'react';
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export default function BarChart({ scores = {} }) {
  const data = [
    { category: 'Güvenlik', score: scores.security || 0 },
    { category: 'Performans', score: scores.performance || 0 },
    { category: 'Kod Kalitesi', score: scores.codeQuality || 0 },
    { category: 'Test Kapsamı', score: scores.testCoverage || 0 },
    { category: 'Mimari', score: scores.architecture || 0 },
  ];

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <XAxis dataKey="category" stroke="#999999" tick={{ fill: '#E5E2E1', fontSize: 11 }} />
          <YAxis domain={[0, 10]} stroke="#444444" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#121212',
              border: '1px solid #333333',
              borderRadius: '6px',
              color: '#FFFFFF',
            }}
          />
          <ReferenceLine y={5} stroke="#FFD600" strokeDasharray="3 3" />
          <Bar dataKey="score" fill="#FF0000" radius={[4, 4, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
