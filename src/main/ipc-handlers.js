'use strict';

const { ipcMain, dialog } = require('electron');
const database = require('./database');
const ollamaService = require('./ollama-service');
const ollamaInstaller = require('./ollama-installer');
const analysisEngine = require('./analysis-engine');
const autoFixService = require('./auto-fix-service');
const exportService = require('./export-service');
const { buildChatPrompt } = require('./prompts/chatbot-prompt');
const updater = require('./updater');

/**
 * In-memory chat conversation context for Ollama multi-turn chat.
 * Reset on clearHistory or app restart.
 */
let chatContext = null;

/**
 * Register all IPC handlers.
 * @param {Electron.BrowserWindow} mainWindow - The main browser window
 */
function registerIpcHandlers(mainWindow) {
  // ──────────────────────────────────
  // Dialog
  // ──────────────────────────────────

  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Project Folder',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, filePath: null };
    }

    return { canceled: false, filePath: result.filePaths[0] };
  });

  // ──────────────────────────────────
  // Analysis
  // ──────────────────────────────────

  ipcMain.handle('analysis:start', async (_event, config) => {
    try {
      // Fire and forget — progress is sent via events
      analysisEngine.startAnalysis(config, mainWindow).catch((err) => {
        console.error('[IPC] analysis:start error:', err.message);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('analysis:error', { error: err.message });
        }
      });
    } catch (err) {
      console.error('[IPC] analysis:start sync error:', err.message);
      throw err;
    }
  });

  ipcMain.handle('analysis:cancel', async () => {
    analysisEngine.cancelAnalysis();
  });

  ipcMain.handle('analysis:getStatus', async () => {
    return analysisEngine.getAnalysisStatus();
  });

  ipcMain.handle('analysis:getResults', async (_event, { projectId }) => {
    let project = database.getProjectById(projectId);
    if (!project) {
      const all = database.getAllProjects();
      if (all.length > 0) {
        project = all[0];
      } else {
        throw new Error(`Project ${projectId} not found`);
      }
    }

    const analysisResults = database.getAnalysisResults(projectId);
    const suggestions = database.getSuggestions(projectId);

    // Build category scores map
    const categoryScores = {};
    for (const result of analysisResults) {
      categoryScores[result.category] = result.score;
    }

    return {
      project,
      analysisResults,
      suggestions,
      overallScore: project.overallScore,
      categoryScores,
    };
  });

  // ──────────────────────────────────
  // Projects
  // ──────────────────────────────────

  ipcMain.handle('projects:getAll', async () => {
    return database.getAllProjects();
  });

  ipcMain.handle('projects:delete', async (_event, { projectId }) => {
    database.deleteProject(projectId);
    return { success: true };
  });

  ipcMain.handle('projects:rename', async (_event, { projectId, name }) => {
    database.updateProject(projectId, { name });
    return { success: true };
  });

  // ──────────────────────────────────
  // Settings
  // ──────────────────────────────────

  ipcMain.handle('settings:get', async () => {
    return database.getSettings();
  });

  ipcMain.handle('settings:save', async (_event, { settings }) => {
    const saved = database.saveSettings(settings);

    // Auto-download selected models if missing from Ollama
    (async () => {
      try {
        await ollamaInstaller.ensureOllamaRunning();
        const availableModels = await ollamaService.listModels();
        const modelNames = availableModels.map((m) => m.name);

        const modelsToCheck = [settings.fastModeModel, settings.deepModeModel].filter(Boolean);
        for (const targetModel of modelsToCheck) {
          const hasModel = modelNames.some((n) => n === targetModel || n.startsWith(targetModel));
          if (!hasModel) {
            console.log(`[Settings] Model ${targetModel} not found. Triggering background auto-download.`);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('analysis:progress', {
                percent: 0,
                currentFile: `Model '${targetModel}' otomatik indiriliyor...`,
                fileIndex: 0,
                totalFiles: 100,
              });
            }
            await ollamaService.pullModel(targetModel, (prog) => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('analysis:progress', {
                  percent: prog.percent || 0,
                  currentFile: `Model '${targetModel}' otomatik indiriliyor (${prog.status})...`,
                  fileIndex: 0,
                  totalFiles: 100,
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('[Settings] Failed to auto-download selected model:', err.message);
      }
    })();

    return saved;
  });

  // ──────────────────────────────────
  // Chat
  // ──────────────────────────────────

  ipcMain.handle('chat:send', async (_event, { message, model }) => {
    try {
      const settings = database.getSettings();
      let targetModel = model || settings.fastModeModel;

      // Verify model exists in Ollama, fallback to available model if missing
      try {
        const availableModels = await ollamaService.listModels();
        const modelNames = availableModels.map((m) => m.name);
        const hasExactModel = modelNames.some((n) => n === targetModel || n.startsWith(targetModel));
        if (!hasExactModel && availableModels.length > 0) {
          targetModel = availableModels[0].name;
        }
      } catch (e) {
        // Ignore check errors
      }

      const chatModel = targetModel;

      // Build context from available analysis data
      const context = {};

      // Try to get latest analysis results for context
      const projects = database.getAllProjects();
      if (projects.length > 0) {
        const latestProject = projects[0];
        const results = database.getAnalysisResults(latestProject.id);
        const categoryScores = {};
        const topIssues = [];

        for (const r of results) {
          categoryScores[r.category] = r.score;
          if (Array.isArray(r.issues)) {
            topIssues.push(...r.issues);
          }
        }

        context.analysisResults = {
          projectName: latestProject.name,
          overallScore: latestProject.overallScore,
          categoryScores,
          topIssues: topIssues.slice(0, 10),
          totalFiles: 0,
        };
      }

      // Get language stats for project suggestions
      const allProjects = database.getAllProjects();
      if (allProjects.length > 0) {
        const { getLibraryStats } = require('./library-stats');
        const stats = getLibraryStats();
        if (stats && Object.keys(stats).length > 0) {
          context.languageStats = stats;
        }
      }

      const prompt = buildChatPrompt(message, context);

      // Stream the response
      chatContext = await ollamaService.streamChat(
        prompt,
        chatModel,
        chatContext,
        (chunk) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('chat:response-chunk', chunk);
          }
        }
      );
    } catch (err) {
      console.error('[IPC] chat:send error:', err.message);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('chat:response-chunk', {
          chunk: `\n\n⚠️ Error: ${err.message}`,
          done: true,
        });
      }
    }
  });

  ipcMain.handle('chat:stop', async () => {
    ollamaService.stopChat();
    return { success: true };
  });

  ipcMain.handle('chat:clearHistory', async () => {
    chatContext = null;
    return { success: true };
  });

  // ──────────────────────────────────
  // Export
  // ──────────────────────────────────

  ipcMain.handle('export:report', async (_event, { projectId }) => {
    const project = database.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const analysisResults = database.getAnalysisResults(projectId);
    const suggestions = database.getSuggestions(projectId);

    const markdown = exportService.exportToMarkdown(project, analysisResults, suggestions);
    const result = await exportService.saveReport(markdown, project.name);

    return result;
  });

  // ──────────────────────────────────
  // Ollama
  // ──────────────────────────────────

  ipcMain.handle('ollama:check', async () => {
    const { installed } = await ollamaInstaller.checkOllamaInstalled();
    if (installed) {
      await ollamaInstaller.ensureOllamaRunning();
    }
    const connection = await ollamaService.checkConnection();

    return {
      installed,
      running: connection.running,
      models: connection.models,
    };
  });

  ipcMain.handle('ollama:install', async () => {
    try {
      await ollamaInstaller.installOllama((progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ollama:install-progress', progress);
        }
      });

      // Ensure daemon is running before pulling models
      await ollamaInstaller.ensureOllamaRunning();

      // After installation, pull required models
      await ollamaInstaller.pullRequiredModels((progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ollama:install-progress', progress);
        }
      });

      return { success: true };
    } catch (err) {
      console.error('[IPC] ollama:install error:', err.message);
      throw err;
    }
  });

  ipcMain.handle('ollama:pullModel', async (_event, { modelName }) => {
    try {
      await ollamaService.pullModel(modelName, (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ollama:install-progress', {
            step: 'pulling',
            percent: progress.percent,
            message: `Pulling ${modelName}: ${progress.status}`,
          });
        }
      });
      return { success: true };
    } catch (err) {
      throw new Error(`Failed to pull model: ${err.message}`);
    }
  });

  // ──────────────────────────────────
  // Auto-Fix
  // ──────────────────────────────────

  ipcMain.handle('autofix:generate', async (_event, { filePath, issue, code }) => {
    const settings = database.getSettings();
    let targetModel = settings.deepModeModel;

    try {
      const availableModels = await ollamaService.listModels();
      const modelNames = availableModels.map((m) => m.name);
      const hasExactModel = modelNames.some((n) => n === targetModel || n.startsWith(targetModel));
      if (!hasExactModel && availableModels.length > 0) {
        targetModel = availableModels[0].name;
      }
    } catch (e) {}

    const model = targetModel;
    const result = await autoFixService.generateFix(filePath, issue, code, model);
    return result;
  });

  ipcMain.handle('autofix:apply', async (_event, { filePath, original, suggested }) => {
    const result = await autoFixService.applyFix(filePath, original, suggested);
    return result;
  });

  // ──────────────────────────────────
  // Library Stats
  // ──────────────────────────────────

  ipcMain.handle('library:getStats', async () => {
    const { getLibraryStats } = require('./library-stats');
    return getLibraryStats();
  });

  // ──────────────────────────────────
  // Updates
  // ──────────────────────────────────

  ipcMain.handle('update:check', async () => {
    const result = await updater.checkForUpdates();
    return result;
  });

  ipcMain.handle('update:install', async () => {
    updater.installUpdate();
  });
}

module.exports = {
  registerIpcHandlers,
};
