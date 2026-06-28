# 🤖 AI SYSTEM PROMPT: CODE REFACTORING & AUDIT FIXES

> **Instruction to AI Assistant**: You are acting as an expert Senior Software Architect and Code Auditor. Examine the codebase audit finding below for project **Scout_Code-Analysis** and follow the structured tasks to refactor, fix, and optimize every reported issue.

---

## 📌 PROJECT METADATA
- **Project Name**: `Scout_Code-Analysis`
- **Project Root Path**: `C:\Users\ibrah\Documents\GitHub\Scout_Code-Analysis`
- **Analysis Date**: `2026-06-28`
- **Scan Mode**: `Fast Analysis`
- **Overall Health Score**: `6.8/10`

### Category Audit Scores:
- **SECURITY**: `6.7/10`
- **PERFORMANCE**: `6.7/10`
- **CODEQUALITY**: `8.0/10`
- **TESTCOVERAGE**: `6.0/10`
- **ARCHITECTURE**: `6.7/10`

---

## 🎯 OBJECTIVES & GUIDELINES FOR THE AI ASSISTANT
1. Address all detected issues listed below step by step.
2. Explain the root cause and refactor the code to eliminate security leaks, performance bottlenecks, or architectural smells.
3. Preserve clean code standards, avoid regressions, and maintain existing project style.

---

## 🛠️ DETECTED TASKS & ACTIONABLE FIXES

### 📂 CATEGORY: SECURITY

#### Task 1: `README.md` [MEDIUM]
- **Issue Summary**: The README.md file should be written in Turkish.
- **Current Problematic Code**:
  ```
  # 🛡️ Scout Code Analysis — Local AI Architect
  ```
- **Recommended Fix Snippet**:
  ```
  # 🛡️ Scout Code Analysis — Local AI Architect
  ```

#### Task 2: `scripts/wait-for-vite.js` [MEDIUM]
- **Issue Summary**: To mitigate the security risks associated with using `http.get`, consider using a more secure HTTP client library such as `axios` or `https`. Also, ensure that the server is properly configured to handle requests and responses.
- **Current Problematic Code**:
  ```
  const http = require('http');

const VITE_URL = 'http://localhost:5173';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

let retries = 0;

function checkVite() {
  http.get(VITE_URL, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Vite dev server is ready');
      process.exit(0);
    } else {
      retry();
    }
  }).on('error', () => {
    retry();
  });
}

function retry() {
  retries++;
  if (retries >= MAX_RETRIES) {
    console.error('❌ Vite dev server did not start in time');
    process.exit(1);
  }
  console.log(`⏳ Waiting for Vite dev server... (${retries}/${MAX_RETRIES})`);
  setTimeout(checkVite, RETRY_DELAY);
}

checkVite();
  ```
- **Recommended Fix Snippet**:
  ```
  const axios = require('axios');

const VITE_URL = 'http://localhost:5173';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

let retries = 0;

async function checkVite() {
  try {
    const response = await axios.get(VITE_URL);
    if (response.status === 200) {
      console.log('✅ Vite dev server is ready');
      process.exit(0);
    } else {
      retry();
    }
  } catch (error) {
    retry();
  }
}

function retry() {
  retries++;
  if (retries >= MAX_RETRIES) {
    console.error('❌ Vite dev server did not start in time');
    process.exit(1);
  }
  console.log(`⏳ Waiting for Vite dev server... (${retries}/${MAX_RETRIES})`);
  setTimeout(checkVite, RETRY_DELAY);
}

checkVite();
  ```

#### Task 3: `src/main/analysis-engine.js` [MEDIUM]
- **Issue Summary**: Replace 'require' with 'import' for better security and code organization.
- **Current Problematic Code**:
  ```
  const fs = require('fs');
  ```
- **Recommended Fix Snippet**:
  ```
  import fs from 'fs';
  ```

#### Task 4: `src/main/auto-fix-service.js` [MEDIUM]
- **Issue Summary**: To mitigate this security vulnerability, ensure that the `filePath` is properly validated and sanitized before reading the file.
- **Current Problematic Code**:
  ```
  const originalCode = fs.readFileSync(filePath, 'utf-8');
  ```
- **Recommended Fix Snippet**:
  ```
  const filePath = '/path/to/valid/file'; // Ensure this path is properly validated
  ```

#### Task 5: `src/main/chunking-service.js` [MEDIUM]
- **Issue Summary**: Add a check to ensure `MAX_CHUNK_SIZE` is within a reasonable range.
- **Current Problematic Code**:
  ```
  const MAX_CHUNK_SIZE = 3000;
  ```
- **Recommended Fix Snippet**:
  ```
  if (process.env.NODE_ENV === 'production') { const MAX_CHUNK_SIZE = 1000; } else { const MAX_CHUNK_SIZE = 3000; }
  ```

#### Task 6: `src/main/database.js` [MEDIUM]
- **Issue Summary**: Add error handling for the database initialization process. Log errors and rethrow them if necessary.
- **Current Problematic Code**:
  ```
  try { db = new Database(dbPath); } catch (err) { console.error('[DB] Failed to initialize SQLite database:', err.message); throw err; }
  ```
- **Recommended Fix Snippet**:
  ```
  try { db = new Database(dbPath); } catch (err) { console.error('[DB] Failed to initialize SQLite database:', err.message); throw err; }
  ```

#### Task 7: `src/main/ipc-handlers.js` [MEDIUM]
- **Issue Summary**: Add proper error handling to log sensitive information.
- **Current Problematic Code**:
  ```
  console.error('[IPC] analysis:start error:', err.message);
  ```
- **Recommended Fix Snippet**:
  ```
  if (err) console.error('[IPC] analysis:start error:', err.message, 'Sensitive data: ', err.sensitiveData);
  ```

#### Task 8: `src/main/main.js` [MEDIUM]
- **Issue Summary**: Add a check to ensure that the single instance lock is acquired before creating the main window.
- **Current Problematic Code**:
  ```
  app.requestSingleInstanceLock();
  ```
- **Recommended Fix Snippet**:
  ```
  if (gotTheLock) { createWindow(); } else { app.quit(); }
  ```

#### Task 9: `src/main/notification-service.js` [MEDIUM]
- **Issue Summary**: Add a check to ensure the Notification API is supported before creating a notification.
- **Current Problematic Code**:
  ```
  if (!Notification.isSupported()) {
    console.warn('[NotificationService] OS notifications not supported on this platform.');
    return;
}
  ```
- **Recommended Fix Snippet**:
  ```
  if (Notification.isSupported()) {
    const notification = new Notification({
        title,
        body,
        silent: false
    });
    notification.show();
}
  ```

#### Task 10: `src/main/ollama-installer.js` [MEDIUM]
- **Issue Summary**: Use `child_process.spawn` instead of `exec` for running shell commands. This will prevent command injection attacks.
- **Current Problematic Code**:
  ```
  const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
  ```
- **Recommended Fix Snippet**:
  ```
  const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
  ```

#### Task 11: `src/main/ollama-service.js` [MEDIUM]
- **Issue Summary**: Add a try-catch block around the `fetch` call to handle network errors.
- **Current Problematic Code**:
  ```
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, prompt, stream: true, options: { temperature: 0.6, num_predict: 300 } }), signal: activeChatController.signal });
  ```
- **Recommended Fix Snippet**:
  ```
  try { const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, prompt, stream: true, options: { temperature: 0.6, num_predict: 300 } }), signal: activeChatController.signal }); } catch (err) { console.error('[OllamaService] fetch error:', err.message); throw err; }
  ```

#### Task 12: `src/main/preload.js` [MEDIUM]
- **Issue Summary**: Add a check to ensure the module is available before using it.
- **Current Problematic Code**:
  ```
  const { contextBridge, ipcRenderer } = require('electron');
  ```
- **Recommended Fix Snippet**:
  ```
  if (typeof electron !== 'undefined') { const { contextBridge, ipcRenderer } = require('electron'); } else { console.error('Electron not found'); }
  ```

#### Task 13: `src/main/prompts/analysis-prompt.js` [MEDIUM]
- **Issue Summary**: Replace `oldFunction` with `newFunction` to mitigate the injection risk.
- **Current Problematic Code**:
  ```
  const oldFunction = (param) => { return param + '1'; };
  ```
- **Recommended Fix Snippet**:
  ```
  const newFunction = (param) => { return param.replace(/'/g, ''); };
  ```

#### Task 14: `src/main/prompts/autofix-prompt.js` [MEDIUM]
- **Issue Summary**: Add a strict mode declaration at the beginning of the file.
- **Current Problematic Code**:
  ```
  function example() {
  return 'Hello, World!';
}
  ```
- **Recommended Fix Snippet**:
  ```
  'use strict'; function example() {
  return 'Hello, World!';
}
  ```

#### Task 15: `src/main/prompts/chatbot-prompt.js` [MEDIUM]
- **Issue Summary**: Add `use strict` to all JavaScript files in the project.
- **Recommended Fix Snippet**:
  ```
  const { strictMode } = 'use strict';
  ```

#### Task 16: `src/main/updater.js` [MEDIUM]
- **Issue Summary**: Add error handling to the initialization of electron-updater.
- **Current Problematic Code**:
  ```
  try { const { autoUpdater: updater } = require('electron-updater'); autoUpdater = updater; } catch (err) { console.warn('[Updater] electron-updater not available:', err.message); return; }
  ```
- **Recommended Fix Snippet**:
  ```
  try { const { autoUpdater: updater } = require('electron-updater'); autoUpdater = updater; } catch (err) { console.error('[Updater] Failed to initialize electron-updater:', err.message); }
  ```

#### Task 17: `src/renderer/App.jsx` [MEDIUM]
- **Issue Summary**: Add error handling for the `window.electronAPI` check. If it fails, redirect to a safe page.
- **Current Problematic Code**:
  ```
  if (window.electronAPI) { ... } else { navigate('/setup'); }
  ```
- **Recommended Fix Snippet**:
  ```
  try { if (window.electronAPI) { ... } } catch (error) { navigate('/safe-page'); }
  ```

#### Task 18: `src/renderer/components/CategorySelector.jsx` [MEDIUM]
- **Issue Summary**: Add a check to ensure that selectedCategories is not empty before calling onChange.
- **Current Problematic Code**:
  ```
  onChange(selectedCategories.filter((c) => c !== id));
  ```
- **Recommended Fix Snippet**:
  ```
  if (selectedCategories.length > 0) {
    onChange(selectedCategories.filter((c) => c !== id));
} else {
    onChange([]);
}
  ```

#### Task 19: `src/renderer/components/ChatbotPanel.jsx` [MEDIUM]
- **Issue Summary**: Use a library like `react-helmet` to sanitize user input before rendering it in the UI.
- **Current Problematic Code**:
  ```
  setMessages((prev) => [...prev, { role: 'user', text: query }]);
  ```
- **Recommended Fix Snippet**:
  ```
  const sanitizedQuery = sanitizeInput(query); setMessages((prev) => [...prev, { role: 'user', text: sanitizedQuery }]);
  ```

#### Task 20: `src/renderer/components/DiffViewer.jsx` [MEDIUM]
- **Issue Summary**: Add input validation and sanitization to prevent XSS attacks.
- **Current Problematic Code**:
  ```
  function DiffViewer({ isOpen, onClose, originalCode = '', suggestedCode = '', fileName = '', onApprove }) {
  ```
- **Recommended Fix Snippet**:
  ```
  function DiffViewer({ isOpen, onClose, originalCode = '', suggestedCode = '', fileName = '', onApprove }) { const sanitizedOriginalCode = sanitizeInput(originalCode); const sanitizedSuggestedCode = sanitizeInput(suggestedCode);
  ```

#### Task 21: `src/renderer/components/LanguageStats.jsx` [MEDIUM]
- **Issue Summary**: Add input validation to ensure that the 'languages' prop is an object with valid keys and values.
- **Current Problematic Code**:
  ```
  const total = Object.values(languages).reduce((acc, curr) => acc + curr, 0);
  ```
- **Recommended Fix Snippet**:
  ```
  if (typeof languages !== 'object' || !Object.keys(languages).length) return null;
  ```

#### Task 22: `src/renderer/components/Modal.jsx` [MEDIUM]
- **Issue Summary**: Add a check for `isOpen` before rendering the modal to prevent unnecessary re-renders.
- **Current Problematic Code**:
  ```
  if (!isOpen) return null;
  ```
- **Recommended Fix Snippet**:
  ```
  if (isOpen) { ... } else { return null; }
  ```

#### Task 23: `src/renderer/components/ProgressBar.jsx` [MEDIUM]
- **Issue Summary**: Validate and sanitize the `percent` prop to prevent potential security vulnerabilities.
- **Current Problematic Code**:
  ```
  const ProgressBar = ({ percent = 0, currentFile = '', fileIndex = 0, totalFiles = 0, onCancel, mode = 'deep', modelName }) => {
  ```
- **Recommended Fix Snippet**:
  ```
  const validatePercent = (value) => value >= 0 && value <= 100; // Add validation logic
  ```

#### Task 24: `src/renderer/components/ProjectCard.jsx` [MEDIUM]
- **Issue Summary**: Add checks to ensure that project.name and project.folderPath are not null or undefined before rendering them.
- **Current Problematic Code**:
  ```
  if (!project) return null;
  ```
- **Recommended Fix Snippet**:
  ```
  if (project && project.name && project.folderPath) { ... }
  ```

#### Task 25: `src/renderer/components/ProjectFolderCard.jsx` [MEDIUM]
- **Issue Summary**: Add checks to ensure that `runs` is not null or undefined before accessing its properties.
- **Current Problematic Code**:
  ```
  if (!runs || runs.length === 0) return null;
  ```
- **Recommended Fix Snippet**:
  ```
  if (runs && runs.length > 0) { ... }
  ```

#### Task 26: `src/renderer/components/RadarChart.jsx` [MEDIUM]
- **Issue Summary**: Implement proper authentication and authorization mechanisms in the RadarChart component.
- **Current Problematic Code**:
  ```
  const data = [ ... ];
  ```
- **Recommended Fix Snippet**:
  ```
  const data = [ { category: 'Güvenlik', score: scores.security ?? 0 }, ... ];
  ```

#### Task 27: `src/renderer/components/Sidebar.jsx` [MEDIUM]
- **Issue Summary**: Validate and sanitize the `location.pathname` before using it in conditional rendering.
- **Current Problematic Code**:
  ```
  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
  ```
- **Recommended Fix Snippet**:
  ```
  const sanitizedPath = new URLSearchParams(location.search).get('path'); const isActive = sanitizedPath === item.path || (sanitizedPath !== '/' && sanitizedPath.startsWith(item.path));
  ```

#### Task 28: `src/renderer/contexts/LanguageContext.jsx` [MEDIUM]
- **Issue Summary**: Add error handling for the initialization of i18next and its resources to prevent potential security issues.
- **Current Problematic Code**:
  ```
  i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: localStorage.getItem('scout_lang') || 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
});
  ```
- **Recommended Fix Snippet**:
  ```
  try {
  i18n.use(initReactI18next).init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    lng: localStorage.getItem('scout_lang') || 'tr',
    fallbackLng: 'tr',
    interpolation: { escapeValue: false },
  });
} catch (error) {
  console.error('Failed to initialize i18next:', error);
}
  ```

#### Task 29: `src/renderer/contexts/ThemeContext.jsx` [MEDIUM]
- **Issue Summary**: Implement proper input sanitization and validation to prevent XSS attacks.
- **Current Problematic Code**:
  ```
  const theme = localStorage.getItem('scout_theme') || 'dark';
  ```
- **Recommended Fix Snippet**:
  ```
  const sanitizedTheme = sanitizeInput(localStorage.getItem('scout_theme')) || 'dark';
  ```

#### Task 30: `src/renderer/hooks/useAnalysis.js` [MEDIUM]
- **Issue Summary**: Initialize the AnalysisContext context in your main application file and pass it down through the component tree.
- **Current Problematic Code**:
  ```
  const analysis = useAnalysisContext();
  ```
- **Recommended Fix Snippet**:
  ```
  const { initializeAnalysisContext } = require('../contexts/AnalysisContext'); initializeAnalysisContext();
  ```

#### Task 31: `src/renderer/hooks/useDatabase.js` [MEDIUM]
- **Issue Summary**: Add error handling to the API calls. Use try-catch blocks around the API calls and set the error state when an error occurs.
- **Current Problematic Code**:
  ```
  await window.electronAPI.getProjects();
  ```
- **Recommended Fix Snippet**:
  ```
  try { await window.electronAPI.getProjects(); } catch (err) { setError(err.message); }
  ```

#### Task 32: `src/renderer/index.css` [MEDIUM]
- **Issue Summary**: Use a Content Security Policy (CSP) to restrict the sources of external CSS files.
- **Current Problematic Code**:
  ```
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  ```
- **Recommended Fix Snippet**:
  ```
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  ```

#### Task 33: `src/renderer/index.html` [MEDIUM]
- **Issue Summary**: Add a doctype declaration at the beginning of the HTML file. This is crucial for proper rendering and security.
- **Current Problematic Code**:
  ```
  <!DOCTYPE html>
  ```
- **Recommended Fix Snippet**:
  ```
  <!DOCTYPE html>
<html lang="tr">
  ```

#### Task 34: `src/renderer/main.jsx` [MEDIUM]
- **Issue Summary**: Add a Provider for the RouterContext in your application.
- **Current Problematic Code**:
  ```
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
  ```
- **Recommended Fix Snippet**:
  ```
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
    <RouterProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AnalysisProvider>
            <App />
          </AnalysisProvider>
        </ThemeProvider>
      </LanguageProvider>
    </RouterProvider>
  </React.StrictMode>
);
  ```

#### Task 35: `src/renderer/pages/Analysis.jsx` [MEDIUM]
- **Issue Summary**: Add error handling to catch and display errors during the analysis.
- **Current Problematic Code**:
  ```
  try { ... } catch (error) { console.error(error); }
  ```
- **Recommended Fix Snippet**:
  ```
  try { ... } catch (error) { console.error(error); alert('An error occurred: ' + error.message); }
  ```

#### Task 36: `src/renderer/pages/Analysis.jsx` [MEDIUM]
- **Issue Summary**: Validate the input folder path to ensure it is a valid directory.
- **Current Problematic Code**:
  ```
  if (!folderPath) return;
  ```
- **Recommended Fix Snippet**:
  ```
  const fs = require('fs'); if (!fs.existsSync(folderPath)) { alert('Invalid folder path: ' + folderPath); return; }
  ```

#### Task 37: `src/renderer/pages/Analysis.jsx` [MEDIUM]
- **Issue Summary**: Add a case to handle the user cancelling the analysis.
- **Current Problematic Code**:
  ```
  if (completedResults) { ... }
  ```
- **Recommended Fix Snippet**:
  ```
  if (completedResults) { clearCompletedResults(); navigate(`/results/${targetId}`); }
  ```

#### Task 38: `src/renderer/pages/Dashboard.jsx` [MEDIUM]
- **Issue Summary**: Use a secure database connection library like `pg` or `mysql2` to prevent SQL injection attacks.
- **Current Problematic Code**:
  ```
  const { getProjects, deleteProject } = useDatabase();
  ```
- **Recommended Fix Snippet**:
  ```
  import { Pool } from 'pg'; const pool = new Pool({ connectionString: process.env.DATABASE_URL }); const { getProjects, deleteProject } = pool;
  ```

#### Task 39: `src/renderer/pages/Settings.jsx` [MEDIUM]
- **Issue Summary**: Use secure methods to interact with the database, such as prepared statements or parameterized queries.
- **Current Problematic Code**:
  ```
  const fastModel = 'qwen2.5-coder:1.5b';
  ```
- **Recommended Fix Snippet**:
  ```
  const fastModel = await window.electronAPI.getFastModeModel();
  ```

#### Task 40: `src/types/index.d.ts` [MEDIUM]
- **Issue Summary**: Add a method to the `Settings` interface that returns a sanitized version of the language and theme.
- **Current Problematic Code**:
  ```
  interface Settings { id: number; language: string; theme: string; fastModeModel: string; deepModeModel: string; excludedFolders: string[]; excludedFileTypes: string[]; }
  ```
- **Recommended Fix Snippet**:
  ```
  interface Settings { id: number; getSanitizedLanguage(): string; getSanitizedTheme(): string; fastModeModel: string; deepModeModel: string; excludedFolders: string[]; excludedFileTypes: string[]; }
  ```

#### Task 41: `tests/chunking-service.test.js` [MEDIUM]
- **Issue Summary**: Add error handling to the chunkFile function.
- **Current Problematic Code**:
  ```
  chunkFile(code, 'JavaScript');
  ```
- **Recommended Fix Snippet**:
  ```
  try { chunkFile(code, 'JavaScript'); } catch (error) { console.error(error); }
  ```

### 📂 CATEGORY: PERFORMANCE

#### Task 42: `src/main/file-scanner.js` [MEDIUM]
- **Issue Summary**: Replace the `walkDirectory` function with a more efficient asynchronous approach using `fs.promises.readdir`.
- **Current Problematic Code**:
  ```
  walkDirectory(dirPath, basePath, excludedFolderSet, excludedExtSet, files);
  ```
- **Recommended Fix Snippet**:
  ```
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  ```

#### Task 43: `src/main/library-stats.js` [MEDIUM]
- **Issue Summary**: Cache the result of `scanDirectory` for each project to avoid redundant scans.
- **Current Problematic Code**:
  ```
  const result = scanDirectory(...);
  ```
- **Recommended Fix Snippet**:
  ```
  const cachedResult = cache.get(folderPath); if (!cachedResult) { cachedResult = scanDirectory(...); cache.set(folderPath, cachedResult); }
  ```

---

## 🚀 CONFIRMATION REQUEST
After applying these fixes, summarize all modifications made and verify project test coverage.
