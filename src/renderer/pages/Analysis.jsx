import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategorySelector from '../components/CategorySelector';
import ProgressBar from '../components/ProgressBar';
import { useAnalysis } from '../hooks/useAnalysis';
import { useLanguage } from '../contexts/LanguageContext';

export default function Analysis() {
  const [folderPath, setFolderPath] = useState('');
  const [mode, setMode] = useState('deep'); // default to deep as in docs
  const [categories, setCategories] = useState(['security', 'performance', 'codeQuality', 'testCoverage', 'architecture']);

  const navigate = useNavigate();
  const { isAnalyzing, progress, error, completedResults, startAnalysis, cancelAnalysis, clearCompletedResults } = useAnalysis();
  const { t } = useLanguage();

  useEffect(() => {
    if (completedResults) {
      const targetId = completedResults.projectId;
      clearCompletedResults();
      navigate(`/results/${targetId}`);
    }
  }, [completedResults, navigate, clearCompletedResults]);

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.selectFolder();
    if (!res.canceled && res.filePath) {
      setFolderPath(res.filePath);
    }
  };

  const handleStart = async () => {
    if (!folderPath) return;
    startAnalysis({ folderPath, mode, categories });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Header Navbar */}
      <header className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Local AI Architect</span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem' }} className="text-muted">
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>{t('nav.overview')}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t('nav.analysisEngine')}</span>
            <span onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }}>{t('nav.settings')}</span>
          </div>
        </div>
        {!isAnalyzing && (
          <button className="btn btn-primary" disabled={!folderPath || categories.length === 0} onClick={handleStart}>
            {t('nav.runScan')}
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <div className="animate-fade-in" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {!isAnalyzing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t('analysis.startTitle')}</h1>
              <p className="text-muted">{t('analysis.startSubtitle')}</p>
            </div>

            {/* Step 1: Folder Selection */}
            <div className="card" style={{ backgroundColor: 'var(--surface-low)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('analysis.step1Title')}</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  className="input font-mono"
                  value={folderPath}
                  readOnly
                  placeholder={t('analysis.noFolder')}
                />
                <button className="btn btn-secondary" onClick={handleSelectFolder} style={{ flexShrink: 0 }}>
                  {t('analysis.browseFolder')}
                </button>
              </div>
            </div>

            {/* Step 2: Mode Selection */}
            <div className="card" style={{ backgroundColor: 'var(--surface-low)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('analysis.step2Title')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {/* Quick Scan Card */}
                <div
                  onClick={() => setMode('quick')}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: mode === 'quick' ? 'rgba(0, 230, 118, 0.12)' : 'var(--surface-highest)',
                    border: mode === 'quick' ? '2px solid #00E676' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    minHeight: '140px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#00E676', whiteSpace: 'nowrap' }}>
                        🚀 {t('analysis.modeQuick')}
                      </span>
                      <span className="badge font-mono" style={{ backgroundColor: 'rgba(0, 230, 118, 0.2)', color: '#00E676', flexShrink: 0 }}>
                        {t('analysis.quickBadge')}
                      </span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.4, margin: 0 }}>
                      {t('analysis.quickDesc')}
                    </p>
                  </div>
                </div>

                {/* Fast Scan Card */}
                <div
                  onClick={() => setMode('fast')}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: mode === 'fast' ? 'rgba(255, 214, 0, 0.12)' : 'var(--surface-highest)',
                    border: mode === 'fast' ? '2px solid #FFD600' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    minHeight: '140px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFD600', whiteSpace: 'nowrap' }}>
                        ⚡ {t('analysis.modeFast')}
                      </span>
                      <span className="badge font-mono" style={{ backgroundColor: 'rgba(255, 214, 0, 0.2)', color: '#FFD600', flexShrink: 0 }}>
                        {t('analysis.fastBadge')}
                      </span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.4, margin: 0 }}>
                      {t('analysis.fastDesc')}
                    </p>
                  </div>
                </div>

                {/* Deep Scan Card */}
                <div
                  onClick={() => setMode('deep')}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: mode === 'deep' ? 'rgba(255, 0, 0, 0.15)' : 'var(--surface-highest)',
                    border: mode === 'deep' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    minHeight: '140px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                        🔍 {t('analysis.modeDeep')}
                      </span>
                      <span className="badge badge-red font-mono" style={{ flexShrink: 0 }}>
                        {t('analysis.deepBadge')}
                      </span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.4, margin: 0 }}>
                      {t('analysis.deepDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Category Selection */}
            <div className="card" style={{ backgroundColor: 'var(--surface-low)' }}>
              <CategorySelector selectedCategories={categories} onChange={setCategories} />
            </div>
          </div>
        ) : (
          /* Progress View */
          <ProgressBar
            percent={progress.percent}
            currentFile={progress.currentFile}
            fileIndex={progress.fileIndex}
            totalFiles={progress.totalFiles}
            onCancel={cancelAnalysis}
            mode={mode}
          />
        )}

        {error && (
          <div className="card" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            ⚠️ Error: {error}
          </div>
        )}
      </div>

      {/* Footer Metric Bar */}
      <footer className="footer-bar font-mono">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
            <span>{t('analysis.statusReady')}</span>
          </div>
          <span>{t('analysis.engineActive')}</span>
        </div>
        <div>v2.4.0-stable</div>
      </footer>
    </div>
  );
}
