'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let dbPath = null;
let data = {
  settings: {
    id: 1,
    language: 'tr',
    theme: 'dark',
    fastModeModel: 'deepseek-coder:6.7b',
    deepModeModel: 'deepseek-coder-v2:16b',
    excludedFolders: ['node_modules', '.git', 'dist', 'build'],
    excludedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.mp4', '.mp3', '.wav', '.avi', '.mov', '.ttf', '.woff', '.ico'],
  },
  projects: [],
  analysis_results: [],
  suggestions: [],
  nextProjectId: 1,
  nextResultId: 1,
  nextSuggestionId: 1,
};

function saveToFile() {
  if (!dbPath) return;
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error writing db file:', err);
  }
}

function initDatabase() {
  dbPath = path.join(app.getPath('userData'), 'scout-db.json');
  if (fs.existsSync(dbPath)) {
    try {
      const raw = fs.readFileSync(dbPath, 'utf8');
      const parsed = JSON.parse(raw);
      data = { ...data, ...parsed };
    } catch (err) {
      console.error('[DB] Error loading db file, using defaults:', err);
    }
  } else {
    saveToFile();
  }
  return data;
}

function getDb() {
  return data;
}

function getOrCreateSettings() {
  if (!data.settings) {
    data.settings = {
      id: 1,
      language: 'tr',
      theme: 'dark',
      fastModeModel: 'deepseek-coder:6.7b',
      deepModeModel: 'deepseek-coder-v2:16b',
      excludedFolders: ['node_modules', '.git', 'dist', 'build'],
      excludedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.mp4', '.mp3', '.wav', '.avi', '.mov', '.ttf', '.woff', '.ico'],
    };
  }
  return { ...data.settings };
}

function getSettings() {
  return getOrCreateSettings();
}

function saveSettings(settings) {
  const current = getOrCreateSettings();
  const merged = { ...current, ...settings };

  if (typeof merged.excludedFolders === 'string') {
    try { merged.excludedFolders = JSON.parse(merged.excludedFolders); } catch (e) {}
  }
  if (typeof merged.excludedFileTypes === 'string') {
    try { merged.excludedFileTypes = JSON.parse(merged.excludedFileTypes); } catch (e) {}
  }

  data.settings = merged;
  saveToFile();
  return getOrCreateSettings();
}

function getAllProjects() {
  return [...data.projects].sort((a, b) => (b.analysisDate || '').localeCompare(a.analysisDate || ''));
}

function getProjectById(projectId) {
  const p = data.projects.find((item) => item.id === Number(projectId));
  return p ? { ...p } : null;
}

function createProject(project) {
  const id = data.nextProjectId++;
  const newProject = {
    id,
    name: project.name,
    folderPath: project.folderPath,
    analysisDate: project.analysisDate || new Date().toISOString().split('T')[0],
    mode: project.mode,
    selectedCategories: Array.isArray(project.selectedCategories)
      ? project.selectedCategories
      : typeof project.selectedCategories === 'string'
      ? JSON.parse(project.selectedCategories || '[]')
      : [],
    overallScore: project.overallScore || 0,
    version: project.version || 1,
  };

  data.projects.push(newProject);
  saveToFile();
  return id;
}

function updateProject(projectId, updates) {
  const idx = data.projects.findIndex((item) => item.id === Number(projectId));
  if (idx !== -1) {
    data.projects[idx] = { ...data.projects[idx], ...updates };
    saveToFile();
  }
}

function deleteProject(projectId) {
  const id = Number(projectId);
  data.projects = data.projects.filter((p) => p.id !== id);
  data.analysis_results = data.analysis_results.filter((r) => r.projectId !== id);
  data.suggestions = data.suggestions.filter((s) => s.projectId !== id);
  saveToFile();
}

function getAnalysisResults(projectId) {
  const id = Number(projectId);
  return data.analysis_results.filter((r) => r.projectId === id).map((r) => ({ ...r }));
}

function saveAnalysisResults(projectId, results) {
  const id = Number(projectId);
  data.analysis_results = data.analysis_results.filter((r) => r.projectId !== id);
  for (const result of results) {
    data.analysis_results.push({
      id: data.nextResultId++,
      projectId: id,
      category: result.category,
      score: result.score || 0,
      issues: result.issues || [],
    });
  }
  saveToFile();
}

function getSuggestions(projectId) {
  const id = Number(projectId);
  return data.suggestions.filter((s) => s.projectId === id).map((s) => ({ ...s }));
}

function saveSuggestion(suggestion) {
  const newS = {
    id: data.nextSuggestionId++,
    projectId: Number(suggestion.projectId),
    filePath: suggestion.filePath || null,
    category: suggestion.category || null,
    severity: suggestion.severity || null,
    message: suggestion.message || null,
    suggestedCode: suggestion.suggestedCode || null,
    originalCode: suggestion.originalCode || null,
    lineNumber: suggestion.lineNumber || null,
  };
  data.suggestions.push(newS);
  saveToFile();
}

function saveSuggestions(projectId, suggestions) {
  const id = Number(projectId);
  data.suggestions = data.suggestions.filter((s) => s.projectId !== id);
  for (const s of suggestions) {
    saveSuggestion({ ...s, projectId: id });
  }
}

function closeDatabase() {
  saveToFile();
}

module.exports = {
  initDatabase,
  getDb,
  getOrCreateSettings,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getAnalysisResults,
  saveAnalysisResults,
  getSuggestions,
  saveSuggestion,
  saveSuggestions,
  getSettings,
  saveSettings,
  closeDatabase,
};
