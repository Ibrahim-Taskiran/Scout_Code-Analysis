import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AnalysisProvider } from './contexts/AnalysisContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AnalysisProvider>
            <App />
          </AnalysisProvider>
        </ThemeProvider>
      </LanguageProvider>
    </HashRouter>
  </React.StrictMode>
);
