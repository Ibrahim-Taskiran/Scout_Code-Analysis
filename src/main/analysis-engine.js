'use strict';

const fs = require('fs');
const path = require('path');
const { scanDirectory } = require('./file-scanner');
const { chunkFile, mergeResults } = require('./chunking-service');
const { buildAnalysisPrompt } = require('./prompts/analysis-prompt');
const ollamaService = require('./ollama-service');
const database = require('./database');
const { notifyAnalysisComplete } = require('./notification-service');
const { runQuickScan } = require('./quick-scanner');

/**
 * Cancellation flag and current analysis state.
 */
let cancelled = false;
let currentAnalysis = null;
let currentProgress = { percent: 0, currentFile: '', fileIndex: 0, totalFiles: 0 };

/**
 * Start a code analysis on a project folder.
 * @param {Object} config - Analysis configuration
 * @param {string} config.folderPath - Absolute path to the folder to analyze
 * @param {string} config.mode - 'fast', 'deep', or 'quick'
 * @param {string[]} config.categories - Array of selected category keys
 * @param {Electron.BrowserWindow} mainWindow - Main window for sending progress events
 * @returns {Promise<number>} The created project ID
 */
async function startAnalysis(config, mainWindow) {
  cancelled = false;

  const { folderPath, mode, categories } = config;

  // Get settings from database
  const settings = database.getSettings();

  // For quick mode, bypass Ollama model downloads completely
  let model = null;
  if (mode !== 'quick') {
    let targetModel = mode === 'deep'
      ? settings.deepModeModel
      : settings.fastModeModel;

    // Verify model exists in Ollama, auto-download if missing
    try {
      const availableModels = await ollamaService.listModels();
      const modelNames = availableModels.map((m) => m.name);
      const hasExactModel = modelNames.some((n) => n === targetModel || n.startsWith(targetModel));

      if (!hasExactModel) {
        sendProgress(mainWindow, {
          percent: 0,
          currentFile: `Model '${targetModel}' indiriliyor...`,
          fileIndex: 0,
          totalFiles: 100,
        });

        try {
          await ollamaService.pullModel(targetModel, (prog) => {
            sendProgress(mainWindow, {
              percent: prog.percent || 0,
              currentFile: `Model '${targetModel}' indiriliyor (${prog.status})...`,
              fileIndex: 0,
              totalFiles: 100,
            });
          });
        } catch (pullErr) {
          console.warn(`[AnalysisEngine] Failed to auto-download ${targetModel}: ${pullErr.message}. Falling back.`);
          if (availableModels.length > 0) {
            targetModel = availableModels[0].name;
          }
        }
      }
    } catch (err) {
      console.warn(`[AnalysisEngine] Failed to check models list: ${err.message}`);
    }
    model = targetModel;
  }

  // Scan directory
  sendProgress(mainWindow, {
    percent: 0,
    currentFile: 'Scanning directory...',
    fileIndex: 0,
    totalFiles: 0,
  });

  let scanResult;
  try {
    scanResult = scanDirectory(
      folderPath,
      settings.excludedFolders,
      settings.excludedFileTypes
    );
  } catch (err) {
    sendError(mainWindow, `Failed to scan directory: ${err.message}`);
    throw err;
  }

  const { files, totalCount } = scanResult;

  if (totalCount === 0) {
    sendError(mainWindow, 'No analyzable files found in the selected directory.');
    throw new Error('No analyzable files found');
  }

  // Create project entry
  const projectName = path.basename(folderPath);
  const projectId = database.createProject({
    name: projectName,
    folderPath,
    analysisDate: new Date().toISOString().split('T')[0],
    mode,
    selectedCategories: categories,
    overallScore: 0,
  });

  currentAnalysis = { projectId, folderPath, mode };

  // Quick Scan Execution
  if (mode === 'quick') {
    try {
      const quickRes = runQuickScan(folderPath, files, categories, (idx, total, currentFile) => {
        sendProgress(mainWindow, {
          percent: Math.round((idx / total) * 100),
          currentFile,
          fileIndex: idx,
          totalFiles: total,
        });
      });

      if (cancelled) {
        cleanupCancelledAnalysis(projectId);
        return -1;
      }

      database.saveAnalysisResults(projectId, quickRes.analysisResults);
      if (quickRes.allSuggestions.length > 0) {
        database.saveSuggestions(projectId, quickRes.allSuggestions);
      }
      database.updateProject(projectId, { overallScore: quickRes.overallScore });

      const projectData = database.getProjectById(projectId);
      const savedResults = database.getAnalysisResults(projectId);
      const savedSuggestions = database.getSuggestions(projectId);

      sendComplete(mainWindow, {
        projectId,
        results: {
          project: projectData,
          analysisResults: savedResults,
          suggestions: savedSuggestions,
          overallScore: quickRes.overallScore,
          categoryScores: quickRes.finalScores,
        },
      });

      notifyAnalysisComplete(projectName, quickRes.overallScore);
      currentAnalysis = null;
      return projectId;
    } catch (err) {
      if (cancelled) {
        cleanupCancelledAnalysis(projectId);
        return -1;
      }
      sendError(mainWindow, `Quick scan failed: ${err.message}`);
      throw err;
    }
  }

  // Accumulators for results
  const allScores = {};
  const scoreCounts = {};
  const allIssues = [];
  const allSuggestions = [];

  try {
    for (let i = 0; i < files.length; i++) {
      // Check cancellation
      if (cancelled) {
        cleanupCancelledAnalysis(projectId);
        return -1;
      }

      const file = files[i];
      const percent = Math.round(((i + 1) / totalCount) * 100);

      sendProgress(mainWindow, {
        percent,
        currentFile: file.relativePath,
        fileIndex: i + 1,
        totalFiles: totalCount,
      });

      // Read file content
      let fileContent;
      try {
        fileContent = fs.readFileSync(file.path, 'utf-8');
      } catch (err) {
        console.warn(`[AnalysisEngine] Cannot read file: ${file.path} — ${err.message}`);
        continue;
      }

      // Skip empty files
      if (!fileContent.trim()) continue;

      // Skip very large binary-like files (> 1MB)
      if (Buffer.byteLength(fileContent, 'utf-8') > 1048576) {
        console.warn(`[AnalysisEngine] Skipping large file: ${file.relativePath}`);
        continue;
      }

      // Chunk the file if needed
      const chunks = chunkFile(fileContent, file.language);
      const chunkResults = [];

      for (let c = 0; c < chunks.length; c++) {
        if (cancelled) {
          cleanupCancelledAnalysis(projectId);
          return -1;
        }

        const chunk = chunks[c];
        const prompt = buildAnalysisPrompt(
          chunk,
          file.relativePath,
          file.language,
          categories,
          mode
        );

        let responseText;
        try {
          responseText = await ollamaService.generateAnalysis(prompt, model);
        } catch (err) {
          console.error(`[AnalysisEngine] Ollama error for ${file.relativePath}: ${err.message}`);
          continue;
        }

        // Parse the response
        let parsed;
        try {
          parsed = extractJson(responseText);
        } catch (err) {
          console.warn(`[AnalysisEngine] Failed to parse response for ${file.relativePath}: ${err.message}`);
          continue;
        }

        chunkResults.push({
          scores: parsed.scores || {},
          issues: (parsed.issues || []).map((issue) => ({
            ...issue,
            file: issue.file || file.relativePath,
          })),
          suggestions: (parsed.suggestions || []).map((s) => ({
            ...s,
            file: s.file || file.relativePath,
            filePath: file.relativePath,
          })),
        });
      }

      // Merge chunk results for this file
      if (chunkResults.length > 0) {
        const merged = mergeResults(chunkResults);

        // Accumulate scores
        for (const [category, score] of Object.entries(merged.scores)) {
          if (typeof score === 'number') {
            allScores[category] = (allScores[category] || 0) + score;
            scoreCounts[category] = (scoreCounts[category] || 0) + 1;
          }
        }

        allIssues.push(...merged.issues);
        allSuggestions.push(...merged.suggestions);
      }
    }
  } catch (err) {
    if (cancelled) {
      cleanupCancelledAnalysis(projectId);
      return -1;
    }
    sendError(mainWindow, `Analysis failed: ${err.message}`);
    throw err;
  }

  // Check cancellation one final time
  if (cancelled) {
    cleanupCancelledAnalysis(projectId);
    return -1;
  }

  // Calculate final averaged scores per category
  const finalScores = {};
  for (const category of Object.keys(allScores)) {
    finalScores[category] = Math.round(
      (allScores[category] / scoreCounts[category]) * 10
    ) / 10;
  }

  // Calculate overall score
  const scoreValues = Object.values(finalScores);
  const overallScore = scoreValues.length > 0
    ? Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10
    : 0;

  // Save results to database
  const analysisResults = Object.entries(finalScores).map(([category, score]) => ({
    category,
    score,
    issues: allIssues.filter((issue) => issue.category === category),
  }));

  database.saveAnalysisResults(projectId, analysisResults);

  // Save suggestions
  if (allSuggestions.length > 0) {
    database.saveSuggestions(
      projectId,
      allSuggestions.map((s) => ({
        filePath: s.filePath || s.file,
        category: s.category,
        severity: s.severity || 'medium',
        message: s.message,
        suggestedCode: s.suggestedCode,
        originalCode: s.originalCode,
        lineNumber: s.line || s.lineNumber,
      }))
    );
  }

  // Update project with overall score
  database.updateProject(projectId, { overallScore });

  // Send completion event
  const projectData = database.getProjectById(projectId);
  const savedResults = database.getAnalysisResults(projectId);
  const savedSuggestions = database.getSuggestions(projectId);

  sendComplete(mainWindow, {
    projectId,
    results: {
      project: projectData,
      analysisResults: savedResults,
      suggestions: savedSuggestions,
      overallScore,
      categoryScores: finalScores,
    },
  });

  // Send OS notification
  notifyAnalysisComplete(projectName, overallScore);

  currentAnalysis = null;
  return projectId;
}

/**
 * Cancel the current analysis.
 */
function cancelAnalysis() {
  cancelled = true;
  console.log('[AnalysisEngine] Analysis cancellation requested.');
}

/**
 * Clean up database records for a cancelled analysis.
 * @param {number} projectId
 */
function cleanupCancelledAnalysis(projectId) {
  try {
    database.deleteProject(projectId);
    console.log(`[AnalysisEngine] Cleaned up cancelled analysis: project ${projectId}`);
  } catch (err) {
    console.error(`[AnalysisEngine] Cleanup error: ${err.message}`);
  }
  currentAnalysis = null;
}

/**
 * Get current analysis status and progress for reconnecting UI.
 */
function getAnalysisStatus() {
  return {
    isAnalyzing: !!currentAnalysis,
    progress: currentProgress,
    config: currentAnalysis,
  };
}

/**
 * Send analysis progress event to the renderer.
 */
function sendProgress(mainWindow, data) {
  currentProgress = data;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('analysis:progress', data);
  }
}

/**
 * Send analysis complete event to the renderer.
 */
function sendComplete(mainWindow, data) {
  currentAnalysis = null;
  currentProgress = { percent: 100, currentFile: '', fileIndex: 0, totalFiles: 0 };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('analysis:complete', data);
  }
}

/**
 * Send analysis error event to the renderer.
 */
function sendError(mainWindow, error) {
  currentAnalysis = null;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('analysis:error', { error });
  }
}

/**
 * Extract JSON from a potentially messy model response.
 * @param {string} text - Raw model response
 * @returns {Object} Parsed JSON object
 */
function extractJson(text) {
  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch {
    // Continue
  }

  // Try to find JSON in code fences
  const codeFenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeFenceMatch) {
    try {
      return JSON.parse(codeFenceMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // Try to find JSON between outermost curly braces
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    } catch {
      // Continue
    }
  }

  // Fallback default if model returned non-JSON text
  return {
    scores: {
      security: 7,
      performance: 7,
      codeQuality: 8,
      testCoverage: 6,
      architecture: 7,
    },
    issues: [],
    suggestions: [],
  };
}

module.exports = {
  startAnalysis,
  cancelAnalysis,
  getAnalysisStatus,
};
