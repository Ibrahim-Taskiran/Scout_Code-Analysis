import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import LanguageStats from '../components/LanguageStats';
import ChatbotPanel from '../components/ChatbotPanel';
import { useDatabase } from '../hooks/useDatabase';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ languages: {}, totalProjects: 0, totalFiles: 0, avgScore: 0 });
  const navigate = useNavigate();
  const { getProjects, deleteProject, getLibraryStats } = useDatabase();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const list = await getProjects();
    setProjects(list || []);
    const libStats = await getLibraryStats();
    if (libStats) {
      setStats(libStats);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu projeyi ve analiz sonuçlarını silmek istediğinize emin misiniz?')) {
      await deleteProject(id);
      loadData();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Header Navbar */}
      <header className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Local AI Architect</span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem' }} className="text-muted">
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Overview</span>
            <span>Security</span>
            <span>Performance</span>
            <span>Architecture</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/analysis')}>
            ▶ Run Scan
          </button>
        </div>
      </header>

      {/* Page Content */}
      <div className="animate-fade-in" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ backgroundColor: 'var(--surface-low)' }}>
            <span className="text-muted font-mono" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Analyzed Projects</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '6px', color: 'var(--text-primary)' }}>{projects.length}</h2>
          </div>
          <div className="card" style={{ backgroundColor: 'var(--surface-low)' }}>
            <span className="text-muted font-mono" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Average Score</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '6px', color: 'var(--primary)' }}>
              {stats.avgScore ? stats.avgScore.toFixed(1) : 'N/A'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 10</span>
            </h2>
          </div>
          <div className="card" style={{ backgroundColor: 'var(--surface-low)' }}>
            <span className="text-muted font-mono" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Files Scanned</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '6px', color: 'var(--text-primary)' }}>{stats.totalFiles || 0}</h2>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Recent Analyses List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recent Project Analyses</h3>
            {projects.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <p className="text-muted" style={{ marginBottom: '16px' }}>Henüz kayıtlı bir analiz bulunmuyor.</p>
                <button className="btn btn-primary" onClick={() => navigate('/analysis')}>
                  Proje Klasörü Seç
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => navigate(`/results/${project.id}`)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Language Statistics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Language Profile</h3>
            <div className="card" style={{ backgroundColor: 'var(--surface-low)' }}>
              <LanguageStats languages={stats.languages} />
            </div>
          </div>
        </div>

        {/* Chatbot Panel */}
        <ChatbotPanel />
      </div>

      {/* Footer Metrics Bar */}
      <footer className="footer-bar font-mono">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
            <span>System: Stable</span>
          </div>
          <span>RAM: 8.4GB / 16GB</span>
        </div>
        <div>v2.4.0-stable</div>
      </footer>
    </div>
  );
}
