import React from 'react';

export default function LanguageStats({ languages = {} }) {
  const total = Object.values(languages).reduce((acc, curr) => acc + curr, 0);

  if (total === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }} className="text-muted">
        İstatistik için henüz proje taranmadı.
      </div>
    );
  }

  const sortedLangs = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const colors = ['#6C5CE7', '#00D2FF', '#00E676', '#FFD600', '#FF5252'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sortedLangs.map(([lang, count], idx) => {
        const percentage = Math.round((count / total) * 100);
        return (
          <div key={lang} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 600 }}>{lang}</span>
              <span className="text-muted">{percentage}% ({count} dosya)</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: colors[idx % colors.length],
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
