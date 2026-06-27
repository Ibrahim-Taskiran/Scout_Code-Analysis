import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Results from './pages/Results';
import Settings from './pages/Settings';
import Setup from './pages/Setup';

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial Ollama readiness on app start
    if (window.electronAPI) {
      window.electronAPI.checkOllama().then((res) => {
        if (!res || !res.running) {
          navigate('/setup');
        }
      }).catch(() => {
        navigate('/setup');
      });
    }
  }, []);

  return (
    <Routes>
      <Route path="/setup" element={<Setup />} />
      <Route
        path="/*"
        element={
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/results/:projectId" element={<Results />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>
  );
}
