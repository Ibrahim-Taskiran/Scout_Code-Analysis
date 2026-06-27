import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDatabase } from '../hooks/useDatabase';

const RECOMMENDED_MODELS = [
  { value: 'qwen2.5-coder:1.5b', label: '⚡ qwen2.5-coder:1.5b (Ultra Fast - 986MB)' },
  { value: 'qwen2.5-coder:3b', label: '🔥 qwen2.5-coder:3b (Thermal Efficient - 1.9GB)' },
  { value: 'mistral:7b', label: '🧠 mistral:7b (High Performance - 4.3GB)' },
  { value: 'deepseek-coder:6.7b', label: '🤖 deepseek-coder:6.7b (Standard Fast - 3.8GB)' },
  { value: 'deepseek-coder-v2:16b', label: '🏆 deepseek-coder-v2:16b (Architect Deep - 8.9GB)' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { getSettings, saveSettings } = useDatabase();

  const [fastModel, setFastModel] = useState('qwen2.5-coder:1.5b');
  const [deepModel, setDeepModel] = useState('mistral:7b');
  const [availableModels, setAvailableModels] = useState([]);
  const [excludedFolders, setExcludedFolders] = useState(['node_modules', '.git', 'dist', 'build']);
  const [excludedFiles, setExcludedFiles] = useState(['.jpg', '.png', '.svg', '.mp4']);
  const [folderInput, setFolderInput] = useState('');
  const [fileInput, setFileInput] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    loadSettings();
    checkModels();
  }, []);

  const checkModels = async () => {
    if (!window.electronAPI) return;
    try {
      const res = await window.electronAPI.checkOllama();
      if (res && res.models) {
        setAvailableModels(res.models);
      }
    } catch (err) {
      console.error('Failed to fetch installed models:', err);
    }
  };

  const loadSettings = async () => {
    const s = await getSettings();
    if (s) {
      if (s.fastModeModel) setFastModel(s.fastModeModel);
      if (s.deepModeModel) setDeepModel(s.deepModeModel);
      if (s.excludedFolders) setExcludedFolders(typeof s.excludedFolders === 'string' ? JSON.parse(s.excludedFolders) : s.excludedFolders);
      if (s.excludedFileTypes) setExcludedFiles(typeof s.excludedFileTypes === 'string' ? JSON.parse(s.excludedFileTypes) : s.excludedFileTypes);
    }
  };

  const handleSave = async () => {
    await saveSettings({
      language,
      theme,
      fastModeModel: fastModel,
      deepModeModel: deepModel,
      excludedFolders: JSON.stringify(excludedFolders),
      excludedFileTypes: JSON.stringify(excludedFiles),
    });
    setSavedMsg('Ayarlar başarıyla kaydedildi!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const addFolder = () => {
    if (folderInput && !excludedFolders.includes(folderInput)) {
      setExcludedFolders([...excludedFolders, folderInput]);
      setFolderInput('');
    }
  };

  const removeFolder = (item) => {
    setExcludedFolders(excludedFolders.filter((f) => f !== item));
  };

  const addFile = () => {
    if (fileInput && !excludedFiles.includes(fileInput)) {
      setExcludedFiles([...excludedFiles, fileInput]);
      setFileInput('');
    }
  };

  const removeFile = (item) => {
    setExcludedFiles(excludedFiles.filter((f) => f !== item));
  };

  // Combine recommended and installed model options
  const modelOptionsMap = new Map();
  RECOMMENDED_MODELS.forEach((m) => modelOptionsMap.set(m.value, m.label));
  availableModels.forEach((m) => {
    const name = m.name || m;
    if (!modelOptionsMap.has(name)) {
      modelOptionsMap.set(name, `📦 ${name} (Yüklü Yerel Model)`);
    }
  });

  const modelOptions = Array.from(modelOptionsMap.entries()).map(([value, label]) => ({ value, label }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Header Navbar */}
      <header className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Local AI Architect</span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem' }} className="text-muted">
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Overview</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>System Settings</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          💾 Save Settings
        </button>
      </header>

      {/* Main Content */}
      <div className="animate-fade-in" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Engine & System Settings</h1>
          <p className="text-muted">Uygulama tercihlerini ve AI parametrelerini özelleştirin.</p>
        </div>

        {savedMsg && (
          <div className="card" style={{ borderColor: 'var(--success)', color: 'var(--success)', fontWeight: 600 }}>
            ✅ {savedMsg}
          </div>
        )}

        {/* Appearance */}
        <div className="card" style={{ backgroundColor: 'var(--surface-low)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Appearance & Language</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>App Language</label>
              <select className="select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Theme Mode</label>
              <select className="select" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="dark">Dark (Red & Black)</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Models Selection Dropdowns */}
        <div className="card" style={{ backgroundColor: 'var(--surface-low)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Ollama AI Models (Dropdown Selection)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Fast Mode Model</label>
              <select className="select font-mono" value={fastModel} onChange={(e) => setFastModel(e.target.value)}>
                {modelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Deep Mode Model</label>
              <select className="select font-mono" value={deepModel} onChange={(e) => setDeepModel(e.target.value)}>
                {modelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* File Exclusions */}
        <div className="card" style={{ backgroundColor: 'var(--surface-low)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Scanner Exclusions</h3>
          
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Excluded Folders</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input className="input font-mono" value={folderInput} onChange={(e) => setFolderInput(e.target.value)} placeholder="Örn: secrets" />
              <button className="btn btn-secondary" onClick={addFolder}>Add</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {excludedFolders.map((f) => (
                <span key={f} className="badge badge-red font-mono" style={{ cursor: 'pointer' }} onClick={() => removeFolder(f)}>
                  {f} ✕
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Excluded Extensions</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input className="input font-mono" value={fileInput} onChange={(e) => setFileInput(e.target.value)} placeholder="Örn: .log" />
              <button className="btn btn-secondary" onClick={addFile}>Add</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {excludedFiles.map((f) => (
                <span key={f} className="badge badge-gray font-mono" style={{ cursor: 'pointer' }} onClick={() => removeFile(f)}>
                  {f} ✕
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Metric Bar */}
      <footer className="footer-bar font-mono">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
            <span>Settings Loaded</span>
          </div>
        </div>
        <div>v2.4.0-stable</div>
      </footer>
    </div>
  );
}
