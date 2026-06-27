import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Setup() {
  const [status, setStatus] = useState('checking'); // checking, installing, pulling, done
  const [progressMsg, setProgressMsg] = useState('Ollama bağlantısı kontrol ediliyor...');
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.electronAPI) return;

    checkStatus();

    const removeListener = window.electronAPI.onOllamaInstallProgress((data) => {
      setProgressMsg(data.message || 'Kurulum devam ediyor...');
    });

    return () => removeListener();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await window.electronAPI.checkOllama();
      if (res.running) {
        setStatus('done');
        setProgressMsg('Ollama aktif ve hazır!');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setStatus('ready-to-install');
        setProgressMsg('Ollama kurulu değil veya çalışmıyor.');
      }
    } catch (err) {
      setStatus('ready-to-install');
      setProgressMsg('Ollama bağlantısı kurulamadı.');
    }
  };

  const handleStartSetup = async () => {
    setStatus('installing');
    setProgressMsg('Ollama otomatik indiriliyor ve kuruluyor...');
    try {
      await window.electronAPI.installOllama();
      setStatus('pulling');
      setProgressMsg('Gerekli yapay zeka modelleri çekiliyor (deepseek-coder)...');
      await window.electronAPI.pullModel('deepseek-coder:6.7b');
      setStatus('done');
      setProgressMsg('Kurulum tamamlandı! Gösterge paneline aktarılıyorsunuz...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setStatus('error');
      setProgressMsg(`Kurulum hatası: ${err.message}`);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '20px',
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          padding: '40px 30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          🔍
        </div>

        <div>
          <h1 className="title-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            Scout Code Analysis
          </h1>
          <p className="text-muted" style={{ fontSize: '0.95rem', marginTop: '6px' }}>
            Yerel AI motoru kurulum sihirbazı
          </p>
        </div>

        <div
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            fontSize: '0.9rem',
          }}
        >
          {progressMsg}
        </div>

        {status === 'ready-to-install' && (
          <button className="btn btn-primary" onClick={handleStartSetup} style={{ width: '100%', padding: '14px' }}>
            Tek Tıkla Otomatik Kurulumu Başlat
          </button>
        )}

        {status === 'done' && (
          <div style={{ color: 'var(--success)', fontWeight: 700 }}>✅ Hazır!</div>
        )}
      </div>
    </div>
  );
}
