'use strict';

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Check if Ollama is installed by running 'ollama --version'.
 * @returns {Promise<{installed: boolean, version?: string}>}
 */
function checkOllamaInstalled() {
  return new Promise((resolve) => {
    exec('ollama --version', { timeout: 10000 }, (error, stdout) => {
      if (error) {
        resolve({ installed: false });
      } else {
        const version = stdout.trim();
        resolve({ installed: true, version });
      }
    });
  });
}

/**
 * Install Ollama based on the current platform.
 * @param {Function} onProgress - Callback: ({step, percent, message})
 * @returns {Promise<void>}
 */
async function installOllama(onProgress) {
  const platform = os.platform();

  onProgress({
    step: 'checking',
    percent: 0,
    message: 'Checking if Ollama is already installed...',
  });

  const { installed } = await checkOllamaInstalled();
  if (installed) {
    onProgress({
      step: 'complete',
      percent: 100,
      message: 'Ollama is already installed.',
    });
    return;
  }

  onProgress({
    step: 'downloading',
    percent: 10,
    message: 'Downloading Ollama installer...',
  });

  switch (platform) {
    case 'win32':
      await installOllamaWindows(onProgress);
      break;
    case 'darwin':
      await installOllamaMac(onProgress);
      break;
    case 'linux':
      await installOllamaLinux(onProgress);
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  // Verify installation
  onProgress({
    step: 'verifying',
    percent: 90,
    message: 'Verifying Ollama installation...',
  });

  const verification = await checkOllamaInstalled();
  if (!verification.installed) {
    throw new Error(
      'Ollama installation completed but verification failed. Please try restarting the application.'
    );
  }

  onProgress({
    step: 'complete',
    percent: 100,
    message: 'Ollama installed successfully!',
  });
}

/**
 * Install Ollama on Windows.
 * Downloads the installer .exe and runs it.
 */
async function installOllamaWindows(onProgress) {
  const tempDir = os.tmpdir();
  const installerPath = path.join(tempDir, 'OllamaSetup.exe');

  onProgress({
    step: 'downloading',
    percent: 20,
    message: 'Downloading Ollama for Windows...',
  });

  // Download installer using PowerShell
  await new Promise((resolve, reject) => {
    const downloadCmd = `powershell -Command "Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile '${installerPath}' -UseBasicParsing"`;

    exec(downloadCmd, { timeout: 300000 }, (error) => {
      if (error) {
        reject(new Error(`Failed to download Ollama: ${error.message}`));
      } else {
        resolve();
      }
    });
  });

  onProgress({
    step: 'installing',
    percent: 60,
    message: 'Installing Ollama... This may take a moment.',
  });

  // Run the installer silently
  await new Promise((resolve, reject) => {
    exec(`"${installerPath}" /VERYSILENT /NORESTART`, { timeout: 300000 }, (error) => {
      if (error) {
        // Some installers return non-zero but still install successfully
        console.warn('[OllamaInstaller] Installer returned error (may be OK):', error.message);
      }
      resolve();
    });
  });

  // Cleanup installer
  try {
    fs.unlinkSync(installerPath);
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Install Ollama on macOS.
 * Downloads the .zip and extracts it to /Applications.
 */
async function installOllamaMac(onProgress) {
  const tempDir = os.tmpdir();
  const zipPath = path.join(tempDir, 'Ollama-darwin.zip');

  onProgress({
    step: 'downloading',
    percent: 20,
    message: 'Downloading Ollama for macOS...',
  });

  await new Promise((resolve, reject) => {
    exec(
      `curl -fsSL -o "${zipPath}" https://ollama.com/download/Ollama-darwin.zip`,
      { timeout: 300000 },
      (error) => {
        if (error) {
          reject(new Error(`Failed to download Ollama: ${error.message}`));
        } else {
          resolve();
        }
      }
    );
  });

  onProgress({
    step: 'installing',
    percent: 60,
    message: 'Installing Ollama...',
  });

  await new Promise((resolve, reject) => {
    exec(
      `unzip -o "${zipPath}" -d /Applications`,
      { timeout: 120000 },
      (error) => {
        if (error) {
          reject(new Error(`Failed to extract Ollama: ${error.message}`));
        } else {
          resolve();
        }
      }
    );
  });

  // Cleanup
  try {
    fs.unlinkSync(zipPath);
  } catch {
    // Ignore
  }
}

/**
 * Install Ollama on Linux.
 * Uses the official install script.
 */
async function installOllamaLinux(onProgress) {
  onProgress({
    step: 'installing',
    percent: 30,
    message: 'Installing Ollama via official script...',
  });

  await new Promise((resolve, reject) => {
    exec(
      'curl -fsSL https://ollama.com/install.sh | sh',
      { timeout: 600000 },
      (error) => {
        if (error) {
          reject(new Error(`Failed to install Ollama: ${error.message}`));
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Pull the required default models for Scout.
 * @param {Function} onProgress - Callback: ({step, percent, message})
 */
async function pullRequiredModels(onProgress) {
  const models = [
    { name: 'deepseek-coder:6.7b', label: 'Fast Mode model' },
    { name: 'deepseek-coder-v2:16b', label: 'Deep Mode model' },
  ];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const basePercent = (i / models.length) * 100;
    const perModelPercent = 100 / models.length;

    onProgress({
      step: 'pulling',
      percent: Math.round(basePercent),
      message: `Pulling ${model.label} (${model.name})...`,
    });

    try {
      const ollamaService = require('./ollama-service');
      await ollamaService.pullModel(model.name, (progress) => {
        const currentPercent = basePercent + (progress.percent / 100) * perModelPercent;
        onProgress({
          step: 'pulling',
          percent: Math.round(currentPercent),
          message: `Pulling ${model.label}: ${progress.status} (${progress.percent}%)`,
        });
      });
    } catch (err) {
      onProgress({
        step: 'error',
        percent: Math.round(basePercent),
        message: `Failed to pull ${model.name}: ${err.message}`,
      });
      throw err;
    }
  }

  onProgress({
    step: 'complete',
    percent: 100,
    message: 'All required models are ready!',
  });
}

/**
 * Ensure the Ollama background service is running.
 */
async function ensureOllamaRunning() {
  const ollamaService = require('./ollama-service');
  const conn = await ollamaService.checkConnection();
  if (conn.running) return true;

  const platform = os.platform();
  try {
    if (platform === 'win32') {
      const ollamaExe = path.join(process.env.LOCALAPPDATA || 'C:\\Users\\ibrah\\AppData\\Local', 'Programs\\Ollama\\ollama.exe');
      if (fs.existsSync(ollamaExe)) {
        spawn(ollamaExe, ['serve'], { detached: true, stdio: 'ignore' }).unref();
      } else {
        spawn('ollama', ['serve'], { detached: true, stdio: 'ignore', shell: true }).unref();
      }
    } else {
      spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (err) {
    console.warn('[OllamaInstaller] Failed to spawn ollama serve:', err.message);
  }

  // Wait up to 5 seconds for service to respond
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const testConn = await ollamaService.checkConnection();
    if (testConn.running) return true;
  }

  return false;
}

module.exports = {
  checkOllamaInstalled,
  installOllama,
  pullRequiredModels,
  ensureOllamaRunning,
};

