import React, { useState } from 'react';

export default function ProjectFolderCard({ folderPath, runs = [], onSelectRun, onDeleteRun }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!runs || runs.length === 0) return null;

  // Primary project name from the first run
  const projectName = runs[0].name || 'Proje';

  // Latest run (first in list as projects are ordered by date DESC)
  const latestRun = runs[0];
  const latestScore = latestRun.overallScore || 0;

  const scoreColor =
    latestScore >= 7
      ? 'var(--primary)'
      : latestScore >= 4
      ? 'var(--warning)'
      : 'var(--text-muted)';

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        backgroundColor: 'var(--surface-low)',
        borderColor: isExpanded ? 'var(--primary)' : 'var(--glass-border)',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {/* Folder Card Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'flex-start',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div
            style={{
              fontSize: '1.8rem',
              lineHeight: 1,
              padding: '6px 10px',
              backgroundColor: 'var(--surface-highest)',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
            }}
          >
            📂
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {projectName}
              </h3>
              <span className="badge badge-gray font-mono" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                {runs.length} Analiz
              </span>
            </div>
            <p
              className="text-muted font-mono"
              style={{
                fontSize: '0.75rem',
                marginTop: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '220px',
              }}
              title={folderPath}
            >
              {folderPath}
            </p>
          </div>
        </div>

        {/* Score & Toggle Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-lowest)',
              border: `2px solid ${scoreColor}`,
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              fontWeight: 900,
              fontSize: '1rem',
              color: scoreColor,
              flexShrink: 0,
            }}
            title="Son Analiz Skoru"
          >
            {latestScore ? latestScore.toFixed(1) : 'N/A'}
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Accordion List of Analysis Runs */}
      {isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingTop: '10px',
            borderTop: '1px solid var(--glass-border)',
          }}
        >
          <div className="text-muted font-mono" style={{ fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📜 Geçmiş Analiz Kayıtları ({runs.length}):
          </div>

          {runs.map((run) => {
            const runScoreColor =
              run.overallScore >= 7
                ? '#00E676'
                : run.overallScore >= 4
                ? '#FFD600'
                : '#FF0000';

            return (
              <div
                key={run.id}
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: 'var(--surface-lowest)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--glass-border)',
                  fontSize: '0.82rem',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span
                    className="badge font-mono"
                    style={
                      run.mode === 'quick'
                        ? { backgroundColor: 'rgba(0,230,118,0.2)', color: '#00E676', fontSize: '0.68rem' }
                        : run.mode === 'deep'
                        ? { backgroundColor: 'rgba(255,0,0,0.2)', color: '#FF0000', fontSize: '0.68rem' }
                        : { backgroundColor: 'rgba(255,214,0,0.2)', color: '#FFD600', fontSize: '0.68rem' }
                    }
                  >
                    {run.mode === 'deep' ? '🔍 DEEP' : run.mode === 'quick' ? '🚀 QUICK' : '⚡ FAST'}
                  </span>
                  <span className="text-muted font-mono" style={{ fontSize: '0.75rem' }}>
                    📅 {run.analysisDate || 'N/A'}
                  </span>
                  <span style={{ fontWeight: 800, color: runScoreColor, fontSize: '0.85rem' }}>
                    ⭐ {run.overallScore ? run.overallScore.toFixed(1) : 'N/A'} / 10
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onSelectRun(run.id)}
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    👁️ Rapor
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRun(run.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      padding: '2px 4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    title="Bu Analizi Sil"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
