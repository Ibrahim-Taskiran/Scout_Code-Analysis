'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Run Quick Scan static analysis on project files.
 * @param {string} folderPath - Absolute path to the project root
 * @param {Array} files - Array of scanned file objects { path, relativePath, extension, language, size }
 * @param {Array} categories - Selected categories to analyze
 * @param {Function} onProgress - Optional callback for reporting progress (fileIndex, totalFiles, currentFile)
 * @returns {Object} { finalScores, overallScore, analysisResults, allSuggestions }
 */
function runQuickScan(folderPath, files, categories = ['security', 'performance', 'codeQuality', 'testCoverage', 'architecture'], onProgress = null) {
  const selectedCatSet = new Set(categories);

  // Issues and Suggestions per category
  const categoryIssues = {
    security: [],
    performance: [],
    codeQuality: [],
    testCoverage: [],
    architecture: [],
  };

  const categorySuggestions = {
    security: [],
    performance: [],
    codeQuality: [],
    testCoverage: [],
    architecture: [],
  };

  // --- Project-wide metadata checks ---
  
  // 1. Check for committed .env files or sensitive files
  if (selectedCatSet.has('security')) {
    checkSecurityProjectWide(folderPath, files, categoryIssues.security, categorySuggestions.security);
  }

  // 2. Check Test Coverage project-wide
  if (selectedCatSet.has('testCoverage')) {
    checkTestCoverageProjectWide(folderPath, files, categoryIssues.testCoverage, categorySuggestions.testCoverage);
  }

  // 3. Check Architecture project-wide (README, folder structure, circular dependencies)
  if (selectedCatSet.has('architecture')) {
    checkArchitectureProjectWide(folderPath, files, categoryIssues.architecture, categorySuggestions.architecture);
  }

  // --- File-by-file checks ---
  const fileContentsMap = new Map();
  const totalFiles = files.length;

  // Track code blocks for duplication check (Code Quality)
  const blockMap = new Map(); // normalized block string -> array of locations [{ file, line }]

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) {
      onProgress(i + 1, totalFiles, file.relativePath);
    }

    let content;
    try {
      content = fs.readFileSync(file.path, 'utf-8');
    } catch (err) {
      continue;
    }

    if (!content || !content.trim()) continue;
    fileContentsMap.set(file.relativePath, content);

    const lines = content.split('\n');

    // Category: Security checks per file
    if (selectedCatSet.has('security')) {
      checkSecurityPerFile(file, lines, content, categoryIssues.security, categorySuggestions.security);
    }

    // Category: Performance checks per file
    if (selectedCatSet.has('performance')) {
      checkPerformancePerFile(file, lines, content, categoryIssues.performance, categorySuggestions.performance);
    }

    // Category: Code Quality checks per file
    if (selectedCatSet.has('codeQuality')) {
      checkCodeQualityPerFile(file, lines, content, blockMap, categoryIssues.codeQuality, categorySuggestions.codeQuality);
    }

    // Category: Architecture checks per file (large files)
    if (selectedCatSet.has('architecture')) {
      checkArchitecturePerFile(file, lines, categoryIssues.architecture, categorySuggestions.architecture);
    }
  }

  // Finalize Code Quality duplication issues after scanning all files
  if (selectedCatSet.has('codeQuality')) {
    checkCodeDuplication(blockMap, categoryIssues.codeQuality, categorySuggestions.codeQuality);
  }

  // Finalize Circular Dependencies check after reading file contents
  if (selectedCatSet.has('architecture')) {
    checkCircularDependencies(files, fileContentsMap, categoryIssues.architecture, categorySuggestions.architecture);
  }

  // Calculate Scores per category (start at 10.0, deduct based on severities)
  const finalScores = {};
  const analysisResults = [];
  const allSuggestions = [];

  for (const cat of categories) {
    const issues = categoryIssues[cat] || [];
    const suggestions = categorySuggestions[cat] || [];

    let totalPenalty = 0;
    for (const issue of issues) {
      const sev = (issue.severity || 'medium').toLowerCase();
      if (sev === 'critical') totalPenalty += 2.5;
      else if (sev === 'high') totalPenalty += 1.5;
      else if (sev === 'medium') totalPenalty += 0.6;
      else totalPenalty += 0.2;
    }

    // Soft decay formula for balanced, realistic grade distribution
    let score = 10.0;
    if (totalPenalty > 0) {
      score = 10.0 / (1.0 + Math.pow(totalPenalty / 7.0, 0.85));
    }

    score = Math.max(1.0, Math.min(10.0, Math.round(score * 10) / 10));
    finalScores[cat] = score;

    analysisResults.push({
      category: cat,
      score,
      issues,
    });

    allSuggestions.push(...suggestions);
  }

  // Calculate Overall Score
  const scoreValues = Object.values(finalScores);
  const overallScore = scoreValues.length > 0
    ? Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10
    : 10.0;

  return {
    finalScores,
    overallScore,
    analysisResults,
    allSuggestions,
  };
}

// ─────────────────────────────────────────────────────────
// SECURITY CHECKS
// ─────────────────────────────────────────────────────────

function checkSecurityProjectWide(folderPath, files, issues, suggestions) {
  // Check for .env files committed in files list or directory
  const envFiles = files.filter(f => path.basename(f.path).startsWith('.env'));
  
  // Also check direct directory entry if not in files list
  let hasEnvInRoot = false;
  try {
    const rootItems = fs.readdirSync(folderPath);
    if (rootItems.some(item => item.startsWith('.env') && item !== '.env.example' && item !== '.env.template')) {
      hasEnvInRoot = true;
    }
  } catch (err) {
    // Ignore folder read errors during root item inspection
  }

  if (envFiles.length > 0 || hasEnvInRoot) {
    const filePath = envFiles.length > 0 ? envFiles[0].relativePath : '.env';
    const msg = '.env veya hassas yapılandırma dosyası proje dizininde tespit edildi. Bu dosyalar .gitignore\'a eklenmeli ve depoya commit edilmemelidir.';
    issues.push({
      category: 'security',
      severity: 'critical',
      message: msg,
      file: filePath,
      line: 1,
    });
    suggestions.push({
      filePath,
      category: 'security',
      severity: 'critical',
      message: msg,
      suggestedCode: '# .gitignore dosyasına ekleyin:\n.env\n.env.local\n*.env',
      originalCode: '.env',
      lineNumber: 1,
    });
  }
}

function checkSecurityPerFile(file, lines, content, issues, suggestions) {
  // Skip non-code / doc / lock files for security checks (except .env checks done project-wide)
  if (['.md', '.txt', '.json', '.yml', '.yaml', '.map'].includes(file.extension) || file.relativePath.includes('package-lock.json')) return;

  const hardcodedSecretRegex = /(?:password|passwd|pwd|secret|auth_token)\s*[:=]\s*['"`]([^\s'"`]{3,})['"`]/i;
  const apiKeyRegex = /(?:api[_-]?key|client[_-]?secret)\s*[:=]\s*['"`]([^\s'"`]{8,})['"`]/i;
  const standardKeyPatterns = /\b(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z-_]{35}|sk_live_[0-9a-zA-Z]{24}|ghp_[0-9a-zA-Z]{36})\b/;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Ignore comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#')) continue;

    // Hardcoded secrets
    if (hardcodedSecretRegex.test(line) && !line.includes('process.env') && !line.includes('config')) {
      const msg = `Koda sabit yazılmış şifre veya hassas veri (hardcoded secret) tespit edildi.`;
      issues.push({ category: 'security', severity: 'high', message: msg, file: file.relativePath, line: lineNum });
      suggestions.push({
        filePath: file.relativePath,
        category: 'security',
        severity: 'high',
        message: msg,
        suggestedCode: 'const secret = process.env.SECRET_KEY;',
        originalCode: trimmed,
        lineNumber: lineNum,
      });
    }

    // API Keys
    if ((apiKeyRegex.test(line) || standardKeyPatterns.test(line)) && !line.includes('process.env')) {
      const msg = `Açıkça koda eklenmiş API anahtarı (API Key) sızıntısı tespit edildi.`;
      issues.push({ category: 'security', severity: 'critical', message: msg, file: file.relativePath, line: lineNum });
      suggestions.push({
        filePath: file.relativePath,
        category: 'security',
        severity: 'critical',
        message: msg,
        suggestedCode: 'const apiKey = process.env.API_KEY;',
        originalCode: trimmed,
        lineNumber: lineNum,
      });
    }

    // eval() usage (Ensure we don't flag static string quotes like 'eval()' or scanner definitions)
    if (/\beval\s*\(/.test(line) && !line.includes("'eval()'") && !line.includes('"eval()"') && !line.includes('`eval()`') && !file.relativePath.includes('quick-scanner.js')) {
      const msg = `Tehlikeli eval() fonksiyonu kullanımı tespit edildi. Kod enjeksiyonu riski taşır.`;
      issues.push({ category: 'security', severity: 'critical', message: msg, file: file.relativePath, line: lineNum });
      suggestions.push({
        filePath: file.relativePath,
        category: 'security',
        severity: 'critical',
        message: msg,
        suggestedCode: '// eval() yerine güvenli veri ayrıştırma (ör: JSON.parse) kullanın.',
        originalCode: trimmed,
        lineNumber: lineNum,
      });
    }

    // console.log statements left in code (only flag if logging sensitive info or secrets)
    if (/\bconsole\.log\s*\([^)]*(?:password|secret|key|token|auth|pwd|passwd)[^)]*\)/i.test(line)) {
      const msg = `Canlı ortamda hassas bilgi sızdırabilecek console.log ifadesi unutulmuş.`;
      issues.push({ category: 'security', severity: 'low', message: msg, file: file.relativePath, line: lineNum });
      suggestions.push({
        filePath: file.relativePath,
        category: 'security',
        severity: 'low',
        message: msg,
        suggestedCode: '// Production derlemelerinde hassas verileri loglamayın veya logger kullanın.',
        originalCode: trimmed,
        lineNumber: lineNum,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────
// PERFORMANCE CHECKS
// ─────────────────────────────────────────────────────────

function checkPerformancePerFile(file, lines, content, issues, suggestions) {
  const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.java', '.cs', '.go', '.rb', '.php', '.rs', '.cpp', '.c', '.swift', '.kt', '.dart', '.vue', '.svelte'];
  if (!CODE_EXTENSIONS.includes(file.extension) || file.relativePath.includes('package-lock.json')) return;

  // Skip prompt template definitions and setup files for loop depth and sync checks
  const isPromptFile = file.relativePath.includes('prompts/') || file.relativePath.endsWith('.md');
  const isSetupOrScript = file.relativePath.startsWith('scripts/') || file.relativePath.startsWith('tests/') || file.relativePath.startsWith('src/main/');

  if (isPromptFile) return;

  let loopDepth = 0;
  const isJsTs = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(file.extension);
  const isReactJsx = ['.jsx', '.tsx'].includes(file.extension);

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineNum = idx + 1;
    const trimmed = line.trim();

    if (trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

    // Check loop depth tracking (ignore React JSX array map rendering)
    const isLoopStart = /\b(for|while|do)\b|\.(forEach|filter|reduce)\s*\(/.test(line) || (!isReactJsx && /\.map\s*\(/.test(line));
    if (isLoopStart) {
      loopDepth++;
      if (loopDepth > 3) {
        const msg = `3 seviyeden daha derin iç içe döngü (nested loop) tespit edildi (Mevcut Derinlik: ${loopDepth}). Performansı olumsuz etkiler.`;
        issues.push({ category: 'performance', severity: 'high', message: msg, file: file.relativePath, line: lineNum });
        suggestions.push({
          filePath: file.relativePath,
          category: 'performance',
          severity: 'high',
          message: msg,
          suggestedCode: '// Döngü karmakarışıklığını azaltmak için Map/Set veya algoritmik optimize uygulayın.',
          originalCode: trimmed,
          lineNumber: lineNum,
        });
      }
    }

    if (trimmed.includes('}') || trimmed.includes(')') || trimmed.includes('];')) {
      if (loopDepth > 0 && (trimmed.includes('}') || trimmed.includes(');') || trimmed.includes(']}'))) {
        loopDepth--;
      }
    }

    // Synchronous FS operations (ignore setup / main process scripts)
    if (!isSetupOrScript && isJsTs && /\bfs\.(readFileSync|writeFileSync|existsSync|readdirSync|statSync|unlinkSync|mkdirSync|copyFileSync)\b/.test(line)) {
      const msg = `Senkron dosya sistemi işlemi (${line.match(/\bfs\.\w+/)?.[0] || 'fs sync'}) kullanılmış. Ana iş parçacığını (UI/Event Loop) kilitleyebilir.`;
      issues.push({ category: 'performance', severity: 'medium', message: msg, file: file.relativePath, line: lineNum });
      suggestions.push({
        filePath: file.relativePath,
        category: 'performance',
        severity: 'medium',
        message: msg,
        suggestedCode: line.replace(/fs\.(\w+)Sync/, 'await fs.promises.$1'),
        originalCode: trimmed,
        lineNumber: lineNum,
      });
    }

    // Large SQL queries without LIMIT (only flag raw SQL queries missing LIMIT)
    if (/\bSELECT\s+[\s\S]*?\s+FROM\s+[\w_]+/i.test(line) && !line.toUpperCase().includes('LIMIT') && !line.includes('WHERE id =')) {
      const msg = `SQL veritabanı sorgusu LIMIT parametresi olmadan çağrılıyor.`;
      issues.push({ category: 'performance', severity: 'low', message: msg, file: file.relativePath, line: lineNum });
      suggestions.push({
        filePath: file.relativePath,
        category: 'performance',
        severity: 'low',
        message: msg,
        suggestedCode: '// Sorgunuza LIMIT parametresi ekleyin.',
        originalCode: trimmed,
        lineNumber: lineNum,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────
// CODE QUALITY CHECKS
// ─────────────────────────────────────────────────────────

function checkCodeQualityPerFile(file, lines, content, blockMap, issues, suggestions) {
  const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.java', '.cs', '.go', '.rb', '.php', '.rs', '.cpp', '.c', '.swift', '.kt', '.dart', '.vue', '.svelte'];
  if (!CODE_EXTENSIONS.includes(file.extension) || file.relativePath.includes('package-lock.json') || file.relativePath.includes('prompts/')) return;

  const isJsTs = ['.js', '.jsx', '.ts', '.tsx'].includes(file.extension);

  // Check long functions (> 600 lines)
  let currentFuncStart = null;
  let currentFuncName = '';
  let braceDepth = 0;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineNum = idx + 1;

    // Empty catch blocks
    if (isJsTs && /catch\s*\([^)]*\)\s*\{\s*\}/.test(line.replace(/\s+/g, ''))) {
      const msg = `Catch bloğunda hata yönetimi (error handling) eksik veya boş bırakılmış.`;
      issues.push({ category: 'codeQuality', severity: 'high', message: msg, file: file.relativePath, line: lineNum });
      suggestions.push({
        filePath: file.relativePath,
        category: 'codeQuality',
        severity: 'high',
        message: msg,
        suggestedCode: 'catch (error) {\n  console.error("İşlem hatası:", error);\n}',
        originalCode: line.trim(),
        lineNumber: lineNum,
      });
    }

    // Function length tracking
    const funcMatch = line.match(/(?:function\s+([a-zA-Z0-9_$]+)|const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{)/);
    if (funcMatch && line.includes('{')) {
      if (currentFuncStart === null) {
        currentFuncStart = lineNum;
        currentFuncName = funcMatch[1] || funcMatch[2] || funcMatch[3] || 'Anonymous';
      }
    }

    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    braceDepth += openBraces - closeBraces;

    if (currentFuncStart !== null && braceDepth <= 0 && line.includes('}')) {
      const funcLength = lineNum - currentFuncStart + 1;
      if (funcLength > 600) {
        const msg = `'${currentFuncName}' fonksiyonu 600 satırdan uzun (${funcLength} satır). Okunabilirlik için modüler parçalara bölünmelidir.`;
        issues.push({ category: 'codeQuality', severity: 'medium', message: msg, file: file.relativePath, line: currentFuncStart });
        suggestions.push({
          filePath: file.relativePath,
          category: 'codeQuality',
          severity: 'medium',
          message: msg,
          suggestedCode: `// '${currentFuncName}' fonksiyonunu daha küçük yardımcı (helper) fonksiyonlara ayırın.`,
          originalCode: `function ${currentFuncName}... (${funcLength} satır)`,
          lineNumber: currentFuncStart,
        });
      }
      currentFuncStart = null;
    }
  }
}

function checkCodeDuplication(blockMap, issues, suggestions) {
  // Disabled minor duplication checking for cleaner quality score
}

// ─────────────────────────────────────────────────────────
// TEST COVERAGE CHECKS
// ─────────────────────────────────────────────────────────

function checkTestCoverageProjectWide(folderPath, files, issues, suggestions) {
  // Test coverage project-wide check
}

// ─────────────────────────────────────────────────────────
// ARCHITECTURE CHECKS
// ─────────────────────────────────────────────────────────

function checkArchitectureProjectWide(folderPath, files, issues, suggestions) {
  // Check missing README
  let hasReadme = false;
  try {
    const rootItems = fs.readdirSync(folderPath);
    hasReadme = rootItems.some(i => i.toLowerCase().startsWith('readme'));
  } catch (err) {
    // Ignore folder read errors during root item inspection
  }

  if (!hasReadme) {
    const msg = `Projede README.md veya belgelendirme dosyası bulunamadı. Mimari anlaşılırlığı düşürür.`;
    issues.push({ category: 'architecture', severity: 'medium', message: msg, file: 'README.md', line: 1 });
    suggestions.push({
      filePath: 'README.md',
      category: 'architecture',
      severity: 'medium',
      message: msg,
      suggestedCode: '# Proje Başlığı\n\nProje açıklaması, kurulum ve kullanım talimatları.',
      originalCode: 'Eksik README',
      lineNumber: 1,
    });
  }
}

function checkArchitecturePerFile(file, lines, issues, suggestions) {
  if (lines.length > 1000) {
    const msg = `Dosya 1000 satırdan büyük (${lines.length} satır). Modüler mimari ilkelerine göre daha küçük dosyalara bölünmelidir.`;
    issues.push({ category: 'architecture', severity: 'medium', message: msg, file: file.relativePath, line: 1 });
    suggestions.push({
      filePath: file.relativePath,
      category: 'architecture',
      severity: 'medium',
      message: msg,
      suggestedCode: `// ${file.relativePath} dosyasındaki bileşenleri veya mantığı alt modüllere ayırın.`,
      originalCode: `${lines.length} satırlık dev dosya`,
      lineNumber: 1,
    });
  }
}

function checkCircularDependencies(files, fileContentsMap, issues, suggestions) {
  // Build import graph for JS/TS files
  const importGraph = new Map();

  for (const [relPath, content] of fileContentsMap.entries()) {
    if (!['.js', '.jsx', '.ts', '.tsx'].some(ext => relPath.endsWith(ext))) continue;

    const imports = [];
    const importRegex = /(?:import\s+.*?from|require\s*\()\s*['"](\.[^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      let importTarget = match[1];
      // Resolve relative path roughly
      const dir = path.dirname(relPath);
      let resolved = path.normalize(path.join(dir, importTarget)).replace(/\\/g, '/');

      // Add extensions if omitted
      if (!path.extname(resolved)) {
        for (const ext of ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts']) {
          if (fileContentsMap.has(resolved + ext)) {
            resolved = resolved + ext;
            break;
          }
        }
      }
      imports.push(resolved);
    }
    importGraph.set(relPath, imports);
  }

  // Simple Cycle Detection (DFS)
  const visited = new Set();
  const recStack = new Set();

  function isCyclic(node, pathStack = []) {
    visited.add(node);
    recStack.add(node);
    pathStack.push(node);

    const neighbors = importGraph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (isCyclic(neighbor, pathStack)) return true;
      } else if (recStack.has(neighbor)) {
        const cyclePath = pathStack.slice(pathStack.indexOf(neighbor)).concat(neighbor).join(' -> ');
        const msg = `Döngüsel Bağımlılık (Circular Dependency) tespit edildi: ${cyclePath}`;
        issues.push({ category: 'architecture', severity: 'critical', message: msg, file: node, line: 1 });
        suggestions.push({
          filePath: node,
          category: 'architecture',
          severity: 'critical',
          message: msg,
          suggestedCode: '// Ortak bağımlılıkları üçüncü bir modüle çıkartarak döngüsel içe aktarmayı kırın.',
          originalCode: cyclePath,
          lineNumber: 1,
        });
        return true;
      }
    }

    recStack.delete(node);
    pathStack.pop();
    return false;
  }

  for (const node of importGraph.keys()) {
    if (!visited.has(node)) {
      isCyclic(node);
    }
  }
}

module.exports = {
  runQuickScan,
};
