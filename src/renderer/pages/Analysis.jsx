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
  const { isAnalyzing, progress, error, completedResults, startAnalysis, cancelAnalysis } = useAnalysis();
  const { t } = useLanguage();

  useEffect(() => {
    if (completedResults) {
      navigate(`/results/${completedResults.projectId}`);
    }
  }, [completedResults, navigate]);

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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div
                  onClick={() => setMode('fast')}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: mode === 'fast' ? 'rgba(255, 0, 0, 0.1)' : 'var(--surface-highest)',
                    border: mode === 'fast' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>⚡ {t('analysis.modeFast').toUpperCase()}</span>
                    <span className="badge badge-gray font-mono">{t('analysis.fastScan')}</span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {t('analysis.fastDesc')}
                  </p>
                </div>

                <div
                  onClick={() => setMode('deep')}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: mode === 'deep' ? 'rgba(255, 0, 0, 0.15)' : 'var(--surface-highest)',
                    border: mode === 'deep' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>🔍 {t('analysis.modeDeep').toUpperCase()}</span>
                    <span className="badge badge-red font-mono">{t('analysis.deepArchitect')}</span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {t('analysis.deepDesc')}
                  </p>
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
