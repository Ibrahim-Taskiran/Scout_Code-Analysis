'use strict';

/**
 * Library statistics module.
 * Aggregates language statistics from all analyzed projects.
 */

const database = require('./database');
const { scanDirectory } = require('./file-scanner');

/**
 * Get aggregated language statistics from all analyzed projects.
 * Scans each project's folder (if it still exists) to get current language distribution.
 * Falls back to cached analysis data if the folder is no longer available.
 * @returns {Object} Map of language name → file count
 */
function getLibraryStats() {
  const fs = require('fs');
  const projects = database.getAllProjects();
  const languageStats = {};
  const settings = database.getSettings();

  let totalFiles = 0;
  let totalScoreSum = 0;
  let scoredProjectsCount = 0;

  for (const project of projects) {
    if (project.overallScore !== null && project.overallScore !== undefined) {
      totalScoreSum += project.overallScore;
      scoredProjectsCount++;
    }

    // Try to scan the project folder for current stats
    if (project.folderPath && fs.existsSync(project.folderPath)) {
      try {
        const result = scanDirectory(
          project.folderPath,
          settings.excludedFolders,
          settings.excludedFileTypes
        );

        totalFiles += result.totalCount || 0;
        for (const [lang, count] of Object.entries(result.languages)) {
          languageStats[lang] = (languageStats[lang] || 0) + count;
        }
      } catch (err) {
        console.warn(`[LibraryStats] Failed to scan ${project.folderPath}: ${err.message}`);
      }
    }
  }

  const avgScore = scoredProjectsCount > 0 ? totalScoreSum / scoredProjectsCount : 0;

  return {
    languages: languageStats,
    totalProjects: projects.length,
    totalFiles,
    avgScore,
  };
}

module.exports = {
  getLibraryStats,
};

