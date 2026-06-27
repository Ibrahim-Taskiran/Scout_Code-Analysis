'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Map of file extensions to language names.
 */
const EXTENSION_LANGUAGE_MAP = {
  '.js': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.py': 'Python',
  '.java': 'Java',
  '.cs': 'C#',
  '.go': 'Go',
  '.ts': 'TypeScript',
  '.jsx': 'React',
  '.tsx': 'React TypeScript',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.rs': 'Rust',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.cxx': 'C++',
  '.hpp': 'C++',
  '.c': 'C',
  '.h': 'C',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.kts': 'Kotlin',
  '.dart': 'Dart',
  '.vue': 'Vue',
  '.html': 'HTML',
  '.htm': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.sass': 'SCSS',
  '.less': 'LESS',
  '.sql': 'SQL',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.ps1': 'PowerShell',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.json': 'JSON',
  '.xml': 'XML',
  '.md': 'Markdown',
  '.markdown': 'Markdown',
  '.r': 'R',
  '.lua': 'Lua',
  '.pl': 'Perl',
  '.ex': 'Elixir',
  '.exs': 'Elixir',
  '.erl': 'Erlang',
  '.scala': 'Scala',
  '.clj': 'Clojure',
  '.hs': 'Haskell',
  '.elm': 'Elm',
  '.svelte': 'Svelte',
  '.tf': 'Terraform',
  '.proto': 'Protobuf',
  '.graphql': 'GraphQL',
  '.gql': 'GraphQL',
  '.dockerfile': 'Dockerfile',
  '.toml': 'TOML',
  '.ini': 'INI',
  '.cfg': 'Config',
  '.env': 'Environment',
};

/**
 * Detect the programming language from a file extension.
 * @param {string} extension - File extension including the dot (e.g., '.js')
 * @returns {string|null} Language name or null if unknown
 */
function detectLanguage(extension) {
  if (!extension) return null;
  const ext = extension.toLowerCase();
  return EXTENSION_LANGUAGE_MAP[ext] || null;
}

/**
 * Recursively walk a directory and collect all files.
 * @param {string} dirPath - Absolute path to the directory
 * @param {string} basePath - The original root folder (for computing relative paths)
 * @param {Set<string>} excludedFolderSet - Set of folder names to exclude
 * @param {Set<string>} excludedExtSet - Set of file extensions to exclude (lowercase)
 * @param {Array} files - Accumulated files array (passed by reference)
 */
function walkDirectory(dirPath, basePath, excludedFolderSet, excludedExtSet, files) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    // Skip directories we can't read (permission errors, etc.)
    console.warn(`[FileScanner] Cannot read directory: ${dirPath} — ${err.message}`);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Skip excluded folders
      if (excludedFolderSet.has(entry.name) || excludedFolderSet.has(entry.name.toLowerCase())) {
        continue;
      }
      // Skip hidden directories (starting with .)
      if (entry.name.startsWith('.') && !excludedFolderSet.has(entry.name)) {
        continue;
      }
      walkDirectory(fullPath, basePath, excludedFolderSet, excludedExtSet, files);
    } else if (entry.isFile()) {
      const extension = path.extname(entry.name).toLowerCase();

      // Skip excluded file types
      if (excludedExtSet.has(extension)) {
        continue;
      }

      // Skip files with no extension or that are binary-like
      if (!extension) continue;

      const language = detectLanguage(extension);

      // Only include files with a recognized language/type
      if (!language) continue;

      let size = 0;
      try {
        const stat = fs.statSync(fullPath);
        size = stat.size;
      } catch {
        // If we can't stat, still include with size 0
      }

      const relativePath = path.relative(basePath, fullPath);

      files.push({
        path: fullPath,
        relativePath: relativePath.replace(/\\/g, '/'),
        extension,
        size,
        language,
      });
    }
  }
}

/**
 * Scan a directory for source code files.
 * @param {string} folderPath - Absolute path to the folder to scan
 * @param {string[]} excludedFolders - Array of folder names to exclude
 * @param {string[]} excludedFileTypes - Array of file extensions to exclude (e.g., ['.jpg', '.png'])
 * @returns {{files: Array, totalCount: number, languages: Object}}
 */
function scanDirectory(folderPath, excludedFolders = [], excludedFileTypes = []) {
  if (!fs.existsSync(folderPath)) {
    throw new Error(`Directory does not exist: ${folderPath}`);
  }

  const stat = fs.statSync(folderPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${folderPath}`);
  }

  // Normalize exclusion lists to sets for O(1) lookup
  const excludedFolderSet = new Set(
    excludedFolders.map((f) => f.replace(/[/\\]/g, '').trim())
  );
  const excludedExtSet = new Set(
    excludedFileTypes.map((ext) => {
      const e = ext.trim().toLowerCase();
      return e.startsWith('.') ? e : `.${e}`;
    })
  );

  const files = [];
  walkDirectory(folderPath, folderPath, excludedFolderSet, excludedExtSet, files);

  // Build language statistics
  const languages = {};
  for (const file of files) {
    if (file.language) {
      languages[file.language] = (languages[file.language] || 0) + 1;
    }
  }

  return {
    files,
    totalCount: files.length,
    languages,
  };
}

module.exports = {
  scanDirectory,
  detectLanguage,
  EXTENSION_LANGUAGE_MAP,
};
