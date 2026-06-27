import React from 'react';

export default function ProgressBar({ percent = 0, currentFile = '', fileIndex = 0, totalFiles = 0, onCancel, mode = 'deep', modelName }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-red">{mode.toUpperCase()} MODE</span>
            <span className="font-mono text-muted" style={{ fontSize: '0.85rem' }}>
              {modelName || (mode === 'deep' ? 'deepseek-coder-v2:16b' : 'deepseek-coder:6.7b')}
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Architectural Analysis in Progress</h1>
        </div>
        <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
          {percent}%
        </div>
      </div>

      {/* Main Progress Card */}
      <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Track */}
        <div
          style={{
            width: '100%',
            height: '10px',
            backgroundColor: 'var(--surface-highest)',
            borderRadius: '5px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: '100%',
              backgroundColor: 'var(--primary)',
              borderRadius: '5px',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              boxShadow: '0 0 12px rgba(255,0,0,0.6)',
            }}
          >
            <div className="progress-shimmer" style={{ position: 'absolute', inset: 0 }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="scanning-pulse" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>🔄</span>
            <span className="font-mono" style={{ fontSize: '0.9rem' }}>
              File {fileIndex}/{totalFiles} — <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{currentFile || 'Taranıyor...'}</span>
            </span>
          </div>

          {onCancel && (
            <button className="btn btn-danger" onClick={onCancel} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🛑 Cancel Analysis
            </button>
          )}
        </div>
      </div>

      {/* Category Scanning Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'var(--surface-low)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            🔒
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Security</div>
            <div className="text-muted font-mono" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Scanning leaks...</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'var(--surface-low)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            ⚡
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Performance</div>
            <div className="text-muted font-mono" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Optimizing cycles...</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'var(--surface-low)', opacity: 0.6 }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--surface-highest)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            🏗️
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Architecture</div>
            <div className="text-muted font-mono" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Queued</div>
          </div>
        </div>
      </div>

      {/* Live Log Terminal */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'var(--surface-lowest)' }}>
        <div style={{ backgroundColor: 'var(--surface-highest)', padding: '10px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-mono text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Analysis Engine Log</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#444' }} />
          </div>
        </div>
        <div className="font-mono" style={{ padding: '16px', fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          <p><span style={{ color: 'var(--primary)', fontWeight: 700 }}>[SUCCESS]</span> Local Ollama vector database connected.</p>
          <p><span style={{ color: 'var(--text-primary)' }}>[INFO]</span> Tokenizing project files...</p>
          <p><span style={{ color: 'var(--primary)', fontWeight: 700 }}>[ANALYZING]</span> Processing {currentFile || 'code blocks'} [{percent}% completed]</p>
        </div>
      </div>
    </div>
  );
}
