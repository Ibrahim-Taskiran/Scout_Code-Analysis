'use strict';

/**
 * Auto-updater module using electron-updater.
 * Checks for updates on app launch and sends events to the renderer.
 */

let autoUpdater = null;
let mainWindow = null;

/**
 * Initialize the auto-updater.
 * @param {Electron.BrowserWindow} window - The main browser window
 */
function initUpdater(window) {
  mainWindow = window;

  try {
    // electron-updater is optional; gracefully handle if not available
    const { autoUpdater: updater } = require('electron-updater');
    autoUpdater = updater;
  } catch (err) {
    console.warn('[Updater] electron-updater not available:', err.message);
    return;
  }

  // Configure auto-updater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Suppress update-not-available log noise
  autoUpdater.logger = {
    info: (...args) => console.log('[Updater]', ...args),
    warn: (...args) => console.warn('[Updater]', ...args),
    error: (...args) => console.error('[Updater]', ...args),
  };

  // Register event handlers
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version);
    sendToRenderer('update:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] No updates available.');
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[Updater] Download progress: ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded:', info.version);
    sendToRenderer('update:downloaded', {
      version: info.version,
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err.message);
  });
}

/**
 * Check for application updates.
 * Should be called after app is ready.
 * @returns {Promise<Object|null>}
 */
async function checkForUpdates() {
  if (!autoUpdater) {
    console.warn('[Updater] Auto-updater not initialized.');
    return null;
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (err) {
    console.error('[Updater] Check for updates failed:', err.message);
    return null;
  }
}

/**
 * Install a downloaded update and restart the application.
 */
function installUpdate() {
  if (!autoUpdater) {
    console.warn('[Updater] Auto-updater not initialized.');
    return;
  }

  autoUpdater.quitAndInstall(false, true);
}

/**
 * Send an event to the renderer process.
 * @param {string} channel - IPC channel name
 * @param {*} data - Data to send
 */
function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

module.exports = {
  initUpdater,
  checkForUpdates,
  installUpdate,
};
