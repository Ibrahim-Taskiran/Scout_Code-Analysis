import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export default function RadarChart({ scores = {} }) {
  const data = [
    { category: 'Güvenlik', score: scores.security ?? 0 },
    { category: 'Performans', score: scores.performance ?? 0 },
    { category: 'Kod Kalitesi', score: scores.codeQuality ?? scores['code-quality'] ?? 0 },
    { category: 'Test Kapsamı', score: scores.testCoverage ?? scores['test-coverage'] ?? 0 },
    { category: 'Mimari', score: scores.architecture ?? 0 },
  ];

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar data={data}>
          <PolarGrid stroke="#333333" />
          <PolarAngleAxis dataKey="category" stroke="#999999" tick={{ fill: '#E5E2E1', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#444444" />
          <Radar name="Skor" dataKey="score" stroke="#FF0000" fill="#FF0000" fillOpacity={0.3} />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
