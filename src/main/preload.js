'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  // Dialog
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),

  // Analysis
  startAnalysis: (config) => ipcRenderer.invoke('analysis:start', config),
  cancelAnalysis: () => ipcRenderer.invoke('analysis:cancel'),
  getAnalysisStatus: () => ipcRenderer.invoke('analysis:getStatus'),
  getAnalysisResults: (projectId) => ipcRenderer.invoke('analysis:getResults', { projectId }),

  // Projects
  getProjects: () => ipcRenderer.invoke('projects:getAll'),
  deleteProject: (projectId) => ipcRenderer.invoke('projects:delete', { projectId }),
  renameProject: (projectId, name) => ipcRenderer.invoke('projects:rename', { projectId, name }),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', { settings }),

  // Chatbot
  sendChatMessage: (data) => ipcRenderer.invoke('chat:send', data),
  stopChatMessage: () => ipcRenderer.invoke('chat:stop'),
  clearChatHistory: () => ipcRenderer.invoke('chat:clearHistory'),

  // Export
  exportReport: (projectId) => ipcRenderer.invoke('export:report', { projectId }),

  // Ollama & Setup
  checkOllama: () => ipcRenderer.invoke('ollama:check'),
  installOllama: () => ipcRenderer.invoke('ollama:install'),
  pullModel: (modelName) => ipcRenderer.invoke('ollama:pullModel', { modelName }),

  // Auto-Fix
  generateFix: (data) => ipcRenderer.invoke('autofix:generate', data),
  applyFix: (data) => ipcRenderer.invoke('autofix:apply', data),

  // Library Stats
  getLibraryStats: () => ipcRenderer.invoke('library:getStats'),

  // Updater
  checkForUpdate: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),

  // Event Listeners (Main -> Renderer)
  onAnalysisProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('analysis:progress', handler);
    return () => ipcRenderer.removeListener('analysis:progress', handler);
  },
  onAnalysisComplete: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('analysis:complete', handler);
    return () => ipcRenderer.removeListener('analysis:complete', handler);
  },
  onAnalysisError: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('analysis:error', handler);
    return () => ipcRenderer.removeListener('analysis:error', handler);
  },
  onChatResponseChunk: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('chat:response-chunk', handler);
    return () => ipcRenderer.removeListener('chat:response-chunk', handler);
  },
  onOllamaInstallProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('ollama:install-progress', handler);
    return () => ipcRenderer.removeListener('ollama:install-progress', handler);
  },
  onUpdateAvailable: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('update:available', handler);
    return () => ipcRenderer.removeListener('update:available', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('update:downloaded', handler);
    return () => ipcRenderer.removeListener('update:downloaded', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
