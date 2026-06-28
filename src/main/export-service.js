'use strict';

const { dialog, BrowserWindow } = require('electron');
const fs = require('fs');

/**
 * Category emoji mapping for reports.
 */
const CATEGORY_EMOJIS = {
  security: '🔒',
  performance: '⚡',
  codeQuality: '🧹',
  'code-quality': '🧹',
  testCoverage: '🧪',
  'test-coverage': '🧪',
  architecture: '🏗️',
};

/**
 * Severity emoji mapping.
 */
const SEVERITY_EMOJIS = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
};

/**
 * Generate a clean, human-readable Markdown report from analysis data.
 */
function exportToMarkdown(projectData, analysisResults, suggestions) {
  const lines = [];

  // Header
  lines.push(`# 🔍 Scout Kod Analiz & Mimari Raporu`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Project info
  lines.push(`📁 **Proje Adı:** ${projectData.name}`);
  lines.push(`📂 **Klasör Yolu:** \`${projectData.folderPath}\``);
  lines.push(`📅 **Analiz Tarihi:** ${projectData.analysisDate}`);

  const modeLabel = projectData.mode === 'deep' ? 'Derin Mimari Mod' : projectData.mode === 'quick' ? 'Quick Scan (Anlık Regex)' : 'Hızlı Mod';
  lines.push(`⚡ **Analiz Modu:** ${modeLabel}`);

  if (projectData.selectedCategories && projectData.selectedCategories.length > 0) {
    const catNames = projectData.selectedCategories.map((cat) => {
      const emoji = CATEGORY_EMOJIS[cat] || '📊';
      const name = cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return `${emoji} ${name}`;
    });
    lines.push(`🎯 **Taranan Kategoriler:** ${catNames.join(', ')}`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // Overall score & category scores
  const overallScore = typeof projectData.overallScore === 'number'
    ? projectData.overallScore.toFixed(1)
    : '?';
  lines.push(`## 📊 Genel Proje Sağlık Skoru: **${overallScore} / 10**`);
  lines.push('');

  if (analysisResults && analysisResults.length > 0) {
    lines.push('### 🏆 Kategori Skor Dağılımı');
    lines.push('');
    for (const result of analysisResults) {
      const emoji = CATEGORY_EMOJIS[result.category] || '📊';
      const name = result.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const score = typeof result.score === 'number' ? result.score.toFixed(1) : '?';
      const bar = generateScoreBar(result.score);
      lines.push(`- ${emoji} **${name}**: \`${score}/10\` ${bar}`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // Suggestions & Issues
  if (suggestions && suggestions.length > 0) {
    lines.push('## 💡 Tespit Edilen İyileştirme Önerileri & Hatalar');
    lines.push('');

    for (let i = 0; i < suggestions.length; i++) {
      const s = suggestions[i];
      const file = s.filePath || s.file || 'Genel';
      const lineStr = (s.lineNumber || s.line) ? ` (Satır ${s.lineNumber || s.line})` : '';
      const category = s.category ? `[${s.category.toUpperCase()}]` : '';
      const sevEmoji = SEVERITY_EMOJIS[(s.severity || 'medium').toLowerCase()] || '🟡';

      lines.push(`### ${i + 1}. ${sevEmoji} \`${file}\`${lineStr} ${category}`);
      lines.push(`**Sorun Açıklaması:** ${s.message || 'Açıklama bulunmuyor'}`);
      lines.push('');

      if (s.originalCode) {
        lines.push('**Mevcut Kod:**');
        lines.push('```');
        lines.push(s.originalCode);
        lines.push('```');
        lines.push('');
      }

      if (s.suggestedCode) {
        lines.push('**Önerilen Kod Düzeltmesi:**');
        lines.push('```');
        lines.push(s.suggestedCode);
        lines.push('```');
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('');
  } else {
    lines.push('✨ **Tebrikler! Projede herhangi bir kritik sorun tespit edilmedi.**');
    lines.push('');
  }

  // Footer
  lines.push(`*Bu rapor Scout Code Analysis tarafından ${new Date().toISOString().split('T')[0]} tarihinde otomatik oluşturulmuştur.*`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate a specialized AI Prompt Markdown document for passing to an AI assistant.
 */
function exportToAiPrompt(projectData, analysisResults, suggestions) {
  const lines = [];

  lines.push(`# 🤖 AI SYSTEM PROMPT: CODE REFACTORING & AUDIT FIXES`);
  lines.push('');
  lines.push('> **Instruction to AI Assistant**: You are acting as an expert Senior Software Architect and Code Auditor. Examine the codebase audit finding below for project **' + projectData.name + '** and follow the structured tasks to refactor, fix, and optimize every reported issue.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 📌 PROJECT METADATA');
  lines.push(`- **Project Name**: \`${projectData.name}\``);
  lines.push(`- **Project Root Path**: \`${projectData.folderPath}\``);
  lines.push(`- **Analysis Date**: \`${projectData.analysisDate}\``);
  const modeLabel = projectData.mode === 'deep' ? 'Deep Analysis' : projectData.mode === 'quick' ? 'Quick Scan (Regex)' : 'Fast Analysis';
  lines.push(`- **Scan Mode**: \`${modeLabel}\``);
  const overallScore = typeof projectData.overallScore === 'number' ? projectData.overallScore.toFixed(1) : '?';
  lines.push(`- **Overall Health Score**: \`${overallScore}/10\``);
  lines.push('');

  lines.push('### Category Audit Scores:');
  if (analysisResults && analysisResults.length > 0) {
    for (const res of analysisResults) {
      const catName = res.category.toUpperCase();
      const score = typeof res.score === 'number' ? res.score.toFixed(1) : '?';
      lines.push(`- **${catName}**: \`${score}/10\``);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## 🎯 OBJECTIVES & GUIDELINES FOR THE AI ASSISTANT');
  lines.push('1. Address all detected issues listed below step by step.');
  lines.push('2. Explain the root cause and refactor the code to eliminate security leaks, performance bottlenecks, or architectural smells.');
  lines.push('3. Preserve clean code standards, avoid regressions, and maintain existing project style.');
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## 🛠️ DETECTED TASKS & ACTIONABLE FIXES');
  lines.push('');

  if (suggestions && suggestions.length > 0) {
    const byCategory = {};
    for (const sug of suggestions) {
      const cat = (sug.category || 'general').toUpperCase();
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(sug);
    }

    let itemNum = 1;
    for (const [category, items] of Object.entries(byCategory)) {
      lines.push(`### 📂 CATEGORY: ${category}`);
      lines.push('');

      for (const item of items) {
        const file = item.filePath || item.file || 'General';
        const lineStr = (item.lineNumber || item.line) ? ` (Line ${item.lineNumber || item.line})` : '';
        const severity = (item.severity || 'medium').toUpperCase();

        lines.push(`#### Task ${itemNum++}: \`${file}\`${lineStr} [${severity}]`);
        lines.push(`- **Issue Summary**: ${item.message || 'No description'}`);

        if (item.originalCode) {
          lines.push('- **Current Problematic Code**:');
          lines.push('  ```');
          lines.push(`  ${item.originalCode}`);
          lines.push('  ```');
        }

        if (item.suggestedCode) {
          lines.push('- **Recommended Fix Snippet**:');
          lines.push('  ```');
          lines.push(`  ${item.suggestedCode}`);
          lines.push('  ```');
        }

        lines.push('');
      }
    }
  } else {
    lines.push('No issues found. Confirm project stability.');
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 🚀 CONFIRMATION REQUEST');
  lines.push('After applying these fixes, summarize all modifications made and verify project test coverage.');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate a visual score bar.
 */
function generateScoreBar(score) {
  if (typeof score !== 'number') return '';
  const filled = Math.round(score);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Open a save dialog and write markdown report.
 */
async function saveReport(markdown, projectName, isAiPrompt = false) {
  const date = new Date().toISOString().split('T')[0];
  const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const suffix = isAiPrompt ? 'AI_Prompt' : 'Summary_Report';
  const defaultFileName = `${safeName}_${suffix}_${date}.md`;
  const dialogTitle = isAiPrompt ? 'Save AI Prompt Report (.md)' : 'Save Summary Analysis Report (.md)';

  const result = await dialog.showSaveDialog({
    title: dialogTitle,
    defaultPath: defaultFileName,
    filters: [
      { name: 'Markdown Files', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  try {
    fs.writeFileSync(result.filePath, markdown, 'utf-8');
    return { canceled: false, filePath: result.filePath };
  } catch (err) {
    throw new Error(`Failed to save report: ${err.message}`);
  }
}

/**
 * Generate PDF report and open save dialog.
 */
async function savePdfReport(projectData, analysisResults, suggestions) {
  const modeLabel = projectData.mode === 'deep' ? 'Derin Mimari Mod' : projectData.mode === 'quick' ? 'Quick Scan (Anlık Regex)' : 'Hızlı Mod';
  const overallScore = typeof projectData.overallScore === 'number' ? projectData.overallScore.toFixed(1) : '?';

  let scoresHtml = '';
  if (analysisResults && analysisResults.length > 0) {
    scoresHtml = Object.values(analysisResults).map(r => {
      const name = r.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const score = typeof r.score === 'number' ? r.score.toFixed(1) : '?';
      const pct = Math.round((r.score / 10) * 100);
      return `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 13px; margin-bottom: 4px;">
            <span>${name}</span>
            <span>${score} / 10</span>
          </div>
          <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: ${r.score >= 7 ? '#10b981' : r.score >= 4 ? '#f59e0b' : '#ef4444'}; border-radius: 4px;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  let suggestionsHtml = '';
  if (suggestions && suggestions.length > 0) {
    suggestionsHtml = suggestions.map((s, idx) => {
      const file = s.filePath || s.file || 'Genel';
      const lineStr = (s.lineNumber || s.line) ? ` (Satır ${s.lineNumber || s.line})` : '';
      const sev = (s.severity || 'medium').toLowerCase();
      const badgeColor = sev === 'critical' ? '#ef4444' : sev === 'high' ? '#f97316' : '#f59e0b';

      return `
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 14px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-family: monospace; font-size: 12px; font-weight: 700; color: #374151;">📄 ${file}${lineStr}</span>
            <span style="background: ${badgeColor}; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${sev}</span>
          </div>
          <div style="font-size: 13px; color: #1f2937; margin-bottom: 8px; line-height: 1.4;">${s.message || ''}</div>
          ${s.originalCode ? `<div style="font-family: monospace; font-size: 11px; background: #f3f4f6; color: #4b5563; padding: 8px; border-radius: 4px; margin-bottom: 6px; white-space: pre-wrap; overflow-x: auto;"><strong>Mevcut Kod:</strong>\n${s.originalCode}</div>` : ''}
          ${s.suggestedCode ? `<div style="font-family: monospace; font-size: 11px; background: #ecfdf5; color: #065f46; padding: 8px; border-radius: 4px; white-space: pre-wrap; overflow-x: auto;"><strong>Önerilen Kod:</strong>\n${s.suggestedCode}</div>` : ''}
        </div>
      `;
    }).join('');
  } else {
    suggestionsHtml = '<div style="text-align: center; color: #10b981; padding: 20px; font-weight: 600;">✨ Tebrikler! Projede herhangi bir kritik sorun bulunamadı.</div>';
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Scout Kod Analiz Raporu</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; color: #1f2937; margin: 0; padding: 24px; background: #fafafa; }
        .header { background: #1e1e2d; color: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
        .header h1 { margin: 0 0 12px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; opacity: 0.9; }
        .score-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
        .score-val { font-size: 42px; font-weight: 900; color: #ef4444; line-height: 1; }
        .section-title { font-size: 16px; font-weight: 800; margin: 24px 0 12px 0; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
        .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔍 Scout Code Analysis & Mimari Özet Raporu</h1>
        <div class="meta-grid">
          <div><strong>📁 Proje:</strong> ${projectData.name}</div>
          <div><strong>📅 Tarih:</strong> ${projectData.analysisDate}</div>
          <div><strong>📂 Yol:</strong> ${projectData.folderPath}</div>
          <div><strong>⚡ Mod:</strong> ${modeLabel}</div>
        </div>
      </div>

      <div class="score-card">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Genel Proje Sağlık Skoru</div>
          <div style="font-size: 13px; color: #4b5563; margin-top: 4px;">Tüm kategorilerin ağırlıklı ortalaması</div>
        </div>
        <div class="score-val">${overallScore} <span style="font-size: 18px; color: #9ca3af; font-weight: 600;">/ 10</span></div>
      </div>

      <div class="section-title">📊 Kategori Skor Dağılımı</div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        ${scoresHtml}
      </div>

      <div class="section-title">💡 Tespit Edilen İyileştirme Önerileri & Hatalar</div>
      ${suggestionsHtml}

      <div class="footer">
        Scout Code Analysis Desktop App tarafından ${new Date().toISOString().split('T')[0]} tarihinde oluşturulmuştur.
      </div>
    </body>
    </html>
  `;

  let win = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false },
  });

  try {
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'default' },
    });

    const date = new Date().toISOString().split('T')[0];
    const safeName = projectData.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const defaultFileName = `${safeName}_Ozet_Rapor_${date}.pdf`;

    const result = await dialog.showSaveDialog({
      title: 'Özet Raporu PDF Olarak Kaydet',
      defaultPath: defaultFileName,
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      win.close();
      win = null;
      return { canceled: true };
    }

    fs.writeFileSync(result.filePath, pdfBuffer);
    win.close();
    win = null;
    return { canceled: false, filePath: result.filePath };
  } catch (err) {
    if (win) {
      win.close();
      win = null;
    }
    throw new Error(`PDF oluşturma hatası: ${err.message}`);
  }
}

module.exports = {
  exportToMarkdown,
  exportToAiPrompt,
  saveReport,
  savePdfReport,
};
