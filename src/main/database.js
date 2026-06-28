'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

let db = null;

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'scout.db');
  db = new Database(dbPath);

  // Enable WAL mode for high performance and concurrent reads/writes
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      language TEXT DEFAULT 'tr',
      theme TEXT DEFAULT 'dark',
      fastModeModel TEXT DEFAULT 'deepseek-coder:6.7b',
      deepModeModel TEXT DEFAULT 'deepseek-coder-v2:16b',
      excludedFolders TEXT,
      excludedFileTypes TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      folderPath TEXT NOT NULL,
      analysisDate TEXT,
      mode TEXT,
      selectedCategories TEXT,
      overallScore REAL DEFAULT 0,
      version INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS analysis_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      category TEXT,
      score REAL DEFAULT 0,
      issues TEXT,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      filePath TEXT,
      category TEXT,
      severity TEXT,
      message TEXT,
      suggestedCode TEXT,
      originalCode TEXT,
      lineNumber INTEGER,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // Migration from legacy JSON database if present
  migrateFromJsonIfExist();

  // Ensure default settings exist
  getOrCreateSettings();

  return db;
}

function migrateFromJsonIfExist() {
  const jsonPath = path.join(app.getPath('userData'), 'scout-db.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const data = JSON.parse(raw);

      db.pragma('foreign_keys = OFF');

      db.transaction(() => {
        if (data.settings) {
          const stmt = db.prepare(`
            INSERT OR REPLACE INTO settings (id, language, theme, fastModeModel, deepModeModel, excludedFolders, excludedFileTypes)
            VALUES (1, ?, ?, ?, ?, ?, ?)
          `);
          stmt.run(
            data.settings.language || 'tr',
            data.settings.theme || 'dark',
            data.settings.fastModeModel || 'deepseek-coder:6.7b',
            data.settings.deepModeModel || 'deepseek-coder-v2:16b',
            JSON.stringify(data.settings.excludedFolders || ['node_modules', '.git', 'dist', 'build']),
            JSON.stringify(data.settings.excludedFileTypes || ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.mp4', '.mp3', '.wav', '.avi', '.mov', '.ttf', '.woff', '.ico'])
          );
        }

        const validProjectIds = new Set();

        if (Array.isArray(data.projects)) {
          const insertProject = db.prepare(`
            INSERT OR REPLACE INTO projects (id, name, folderPath, analysisDate, mode, selectedCategories, overallScore, version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const p of data.projects) {
            validProjectIds.add(p.id);
            insertProject.run(
              p.id,
              p.name,
              p.folderPath,
              p.analysisDate,
              p.mode,
              JSON.stringify(p.selectedCategories || []),
              p.overallScore || 0,
              p.version || 1
            );
          }
        }

        if (Array.isArray(data.analysis_results)) {
          const insertResult = db.prepare(`
            INSERT OR REPLACE INTO analysis_results (id, projectId, category, score, issues)
            VALUES (?, ?, ?, ?, ?)
          `);
          for (const r of data.analysis_results) {
            if (validProjectIds.has(r.projectId)) {
              insertResult.run(
                r.id,
                r.projectId,
                r.category,
                r.score || 0,
                JSON.stringify(r.issues || [])
              );
            }
          }
        }

        if (Array.isArray(data.suggestions)) {
          const insertSuggestion = db.prepare(`
            INSERT OR REPLACE INTO suggestions (id, projectId, filePath, category, severity, message, suggestedCode, originalCode, lineNumber)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const s of data.suggestions) {
            if (validProjectIds.has(s.projectId)) {
              insertSuggestion.run(
                s.id,
                s.projectId,
                s.filePath || null,
                s.category || null,
                s.severity || null,
                s.message || null,
                s.suggestedCode || null,
                s.originalCode || null,
                s.lineNumber || null
              );
            }
          }
        }
      })();

      db.pragma('foreign_keys = ON');

      // Rename old json file to bak after successful migration
      fs.renameSync(jsonPath, jsonPath + '.bak');
      console.log('[DB] Migrated legacy JSON database to SQLite successfully.');
    } catch (err) {
      console.error('[DB] Migration from JSON failed:', err);
    }
  }
}

function getDb() {
  return db;
}

function getOrCreateSettings() {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!row) {
    const defaultFolders = JSON.stringify(['node_modules', '.git', 'dist', 'build']);
    const defaultTypes = JSON.stringify(['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.mp4', '.mp3', '.wav', '.avi', '.mov', '.ttf', '.woff', '.ico']);
    db.prepare(`
      INSERT INTO settings (id, language, theme, fastModeModel, deepModeModel, excludedFolders, excludedFileTypes)
      VALUES (1, 'tr', 'dark', 'deepseek-coder:6.7b', 'deepseek-coder-v2:16b', ?, ?)
    `).run(defaultFolders, defaultTypes);
    return getOrCreateSettings();
  }

  return {
    id: row.id,
    language: row.language,
    theme: row.theme,
    fastModeModel: row.fastModeModel,
    deepModeModel: row.deepModeModel,
    excludedFolders: row.excludedFolders ? JSON.parse(row.excludedFolders) : [],
    excludedFileTypes: row.excludedFileTypes ? JSON.parse(row.excludedFileTypes) : [],
  };
}

function getSettings() {
  return getOrCreateSettings();
}

function saveSettings(settings) {
  const current = getOrCreateSettings();
  const merged = { ...current, ...settings };

  const foldersStr = Array.isArray(merged.excludedFolders)
    ? JSON.stringify(merged.excludedFolders)
    : merged.excludedFolders;

  const typesStr = Array.isArray(merged.excludedFileTypes)
    ? JSON.stringify(merged.excludedFileTypes)
    : merged.excludedFileTypes;

  db.prepare(`
    UPDATE settings
    SET language = ?, theme = ?, fastModeModel = ?, deepModeModel = ?, excludedFolders = ?, excludedFileTypes = ?
    WHERE id = 1
  `).run(
    merged.language,
    merged.theme,
    merged.fastModeModel,
    merged.deepModeModel,
    foldersStr,
    typesStr
  );

  return getOrCreateSettings();
}

function getAllProjects() {
  const rows = db.prepare('SELECT * FROM projects ORDER BY analysisDate DESC, id DESC').all();
  return rows.map((row) => ({
    ...row,
    selectedCategories: row.selectedCategories ? JSON.parse(row.selectedCategories) : [],
  }));
}

function getProjectById(projectId) {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(projectId));
  if (!row) return null;
  return {
    ...row,
    selectedCategories: row.selectedCategories ? JSON.parse(row.selectedCategories) : [],
  };
}

function createProject(project) {
  const categoriesStr = Array.isArray(project.selectedCategories)
    ? JSON.stringify(project.selectedCategories)
    : typeof project.selectedCategories === 'string'
    ? project.selectedCategories
    : '[]';

  const dateStr = project.analysisDate || new Date().toISOString().split('T')[0];

  const info = db.prepare(`
    INSERT INTO projects (name, folderPath, analysisDate, mode, selectedCategories, overallScore, version)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    project.name,
    project.folderPath,
    dateStr,
    project.mode,
    categoriesStr,
    project.overallScore || 0,
    project.version || 1
  );

  return info.lastInsertRowid;
}

function updateProject(projectId, updates) {
  const p = getProjectById(projectId);
  if (!p) return;

  const merged = { ...p, ...updates };
  const categoriesStr = Array.isArray(merged.selectedCategories)
    ? JSON.stringify(merged.selectedCategories)
    : merged.selectedCategories;

  db.prepare(`
    UPDATE projects
    SET name = ?, folderPath = ?, analysisDate = ?, mode = ?, selectedCategories = ?, overallScore = ?, version = ?
    WHERE id = ?
  `).run(
    merged.name,
    merged.folderPath,
    merged.analysisDate,
    merged.mode,
    categoriesStr,
    merged.overallScore,
    merged.version,
    Number(projectId)
  );
}

function deleteProject(projectId) {
  const id = Number(projectId);
  db.transaction(() => {
    db.prepare('DELETE FROM suggestions WHERE projectId = ?').run(id);
    db.prepare('DELETE FROM analysis_results WHERE projectId = ?').run(id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  })();
}

function getAnalysisResults(projectId) {
  const rows = db.prepare('SELECT * FROM analysis_results WHERE projectId = ?').all(Number(projectId));
  return rows.map((r) => ({
    ...r,
    issues: r.issues ? JSON.parse(r.issues) : [],
  }));
}

function saveAnalysisResults(projectId, results) {
  const id = Number(projectId);
  db.transaction(() => {
    db.prepare('DELETE FROM analysis_results WHERE projectId = ?').run(id);
    const insertStmt = db.prepare(`
      INSERT INTO analysis_results (projectId, category, score, issues)
      VALUES (?, ?, ?, ?)
    `);
    for (const result of results) {
      insertStmt.run(
        id,
        result.category,
        result.score || 0,
        JSON.stringify(result.issues || [])
      );
    }
  })();
}

function getSuggestions(projectId) {
  const rows = db.prepare('SELECT * FROM suggestions WHERE projectId = ?').all(Number(projectId));
  return rows;
}

function saveSuggestion(suggestion) {
  const info = db.prepare(`
    INSERT INTO suggestions (projectId, filePath, category, severity, message, suggestedCode, originalCode, lineNumber)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(suggestion.projectId),
    suggestion.filePath || null,
    suggestion.category || null,
    suggestion.severity || null,
    suggestion.message || null,
    suggestion.suggestedCode || null,
    suggestion.originalCode || null,
    suggestion.lineNumber || null
  );
  return info.lastInsertRowid;
}

function saveSuggestions(projectId, suggestions) {
  const id = Number(projectId);
  db.transaction(() => {
    db.prepare('DELETE FROM suggestions WHERE projectId = ?').run(id);
    const insertStmt = db.prepare(`
      INSERT INTO suggestions (projectId, filePath, category, severity, message, suggestedCode, originalCode, lineNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of suggestions) {
      insertStmt.run(
        id,
        s.filePath || null,
        s.category || null,
        s.severity || null,
        s.message || null,
        s.suggestedCode || null,
        s.originalCode || null,
        s.lineNumber || null
      );
    }
  })();
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
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
