import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAnalysis } from '../hooks/useAnalysis';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { isAnalyzing, progress } = useAnalysis();

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: '📊' },
    { path: '/analysis', label: t('nav.analysis'), icon: '🔍' },
    { path: '/settings', label: t('nav.settings'), icon: '⚙️' },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '260px',
        height: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        gap: '16px',
        transition: 'width var(--transition-normal)',
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      {/* Header Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--glass-border)',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 0 15px rgba(255,0,0,0.3)',
                fontSize: '1.2rem',
              }}
            >
              ⚡
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
                Scout AI
              </h2>
              <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                LOCAL AI ARCHITECT
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
          title={collapsed ? 'Genişlet' : 'Daralt'}
        >
          {collapsed ? '❯' : '❮'}
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const isAnalysisItem = item.path === '/analysis';

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                justifyContent: collapsed ? 'center' : 'space-between',
                transition: 'all var(--transition-fast)',
              }}
              title={collapsed ? item.label : ''}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'var(--surface-high)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && isAnalysisItem && isAnalyzing && (
                <span className="badge badge-red scanning-pulse" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                  %{progress.percent}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Action */}
      {!collapsed && (
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isAnalyzing ? 'rgba(255, 0, 0, 0.12)' : 'var(--surface-lowest)',
              border: isAnalyzing ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Engine Status</span>
              <span style={{ color: isAnalyzing ? 'var(--primary)' : 'var(--success)', fontWeight: 700 }}>
                {isAnalyzing ? `Scanning (${progress.percent}%)` : 'Active'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Default Model</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>deepseek</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
