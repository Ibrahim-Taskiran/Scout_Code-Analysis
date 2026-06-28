import React from 'react';

export default function ProjectCard({ project, onClick, onDelete }) {
  if (!project) return null;

  const scoreColor =
    project.overallScore >= 7
      ? 'var(--primary)'
      : project.overallScore >= 4
      ? 'var(--warning)'
      : 'var(--text-muted)';

  const categories = typeof project.selectedCategories === 'string'
    ? JSON.parse(project.selectedCategories || '[]')
    : project.selectedCategories || [];

  return (
    <div
      className="card card-interactive"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        backgroundColor: 'var(--surface-low)',
        borderColor: 'var(--glass-border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {project.name}
          </h3>
          <p className="text-muted font-mono" style={{ fontSize: '0.75rem', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
            {project.folderPath}
          </p>
        </div>

        {/* Score Indicator */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            backgroundColor: 'var(--surface-lowest)',
            border: `2px solid ${scoreColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '1.1rem',
            color: scoreColor,
            flexShrink: 0,
          }}
        >
          {project.overallScore ? project.overallScore.toFixed(1) : 'N/A'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span className={`badge ${project.mode === 'deep' ? 'badge-red' : 'badge-gray'}`} style={project.mode === 'quick' ? { backgroundColor: 'rgba(0,230,118,0.2)', color: '#00E676' } : {}}>
          {project.mode === 'deep' ? 'DEEP MODE' : project.mode === 'quick' ? 'QUICK MODE' : 'FAST MODE'}
        </span>
        <span className="text-muted font-mono" style={{ fontSize: '0.75rem' }}>
          📅 {project.analysisDate || 'N/A'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
        {categories.map((cat, idx) => (
          <span
            key={idx}
            className="font-mono text-muted"
            style={{
              fontSize: '0.7rem',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-highest)',
              border: '1px solid var(--glass-border)',
              textTransform: 'uppercase',
            }}
          >
            {cat}
          </span>
        ))}
      </div>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          title="Sil"
        >
          🗑️
        </button>
      )}
    </div>
  );
}
