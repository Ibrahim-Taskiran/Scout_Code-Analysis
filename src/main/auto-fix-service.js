'use strict';

const fs = require('fs');
const { buildAutoFixPrompt } = require('./prompts/autofix-prompt');
const ollamaService = require('./ollama-service');

/**
 * Generate a code fix using Ollama AI.
 * @param {string} filePath - Absolute path to the file
 * @param {string} issue - Description of the issue to fix
 * @param {string} originalCode - The original code snippet containing the issue
 * @param {string} model - Ollama model to use (must be a deep analysis model)
 * @returns {Promise<{original: string, suggested: string, explanation: string}>}
 */
async function generateFix(filePath, issue, originalCode, model) {
  // Detect language from file extension
  const path = require('path');
  const ext = path.extname(filePath).toLowerCase();
  const { detectLanguage } = require('./file-scanner');
  const language = detectLanguage(ext) || 'Unknown';

  const prompt = buildAutoFixPrompt(originalCode, issue, language);

  let responseText;
  try {
    responseText = await ollamaService.generateAnalysis(prompt, model);
  } catch (err) {
    throw new Error(`Failed to generate fix: ${err.message}`);
  }

  // Parse the JSON response
  let parsed;
  try {
    parsed = extractJson(responseText);
  } catch (err) {
    throw new Error(`Failed to parse auto-fix response: ${err.message}`);
  }

  return {
    original: originalCode,
    suggested: parsed.fixedCode || originalCode,
    explanation: parsed.explanation || 'No explanation provided',
  };
}

/**
 * Apply a code fix by replacing original code with suggested code in the file.
 * @param {string} filePath - Absolute path to the file
 * @param {string} originalCode - The original code to replace
 * @param {string} suggestedCode - The suggested code to write
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function applyFix(filePath, originalCode, suggestedCode) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read file: ${err.message}`);
  }

  // Normalize line endings for comparison
  const normalizedContent = fileContent.replace(/\r\n/g, '\n');
  const normalizedOriginal = originalCode.replace(/\r\n/g, '\n');
  const normalizedSuggested = suggestedCode.replace(/\r\n/g, '\n');

  if (!normalizedContent.includes(normalizedOriginal)) {
    // Try a trimmed match as fallback
    const trimmedOriginal = normalizedOriginal.trim();
    const lines = normalizedContent.split('\n');
    let found = false;
    let startIdx = -1;
    let endIdx = -1;

    // Try to find the original code by matching trimmed lines
    const originalLines = trimmedOriginal.split('\n').map((l) => l.trim());
    for (let i = 0; i <= lines.length - originalLines.length; i++) {
      let match = true;
      for (let j = 0; j < originalLines.length; j++) {
        if (lines[i + j].trim() !== originalLines[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        found = true;
        startIdx = i;
        endIdx = i + originalLines.length;
        break;
      }
    }

    if (!found) {
      throw new Error(
        'Original code not found in file. The file may have been modified since the analysis.'
      );
    }

    // Replace the matched lines
    const resultLines = [
      ...lines.slice(0, startIdx),
      normalizedSuggested,
      ...lines.slice(endIdx),
    ];
    const resultContent = resultLines.join('\n');

    // Restore original line endings if file used CRLF
    const finalContent = fileContent.includes('\r\n')
      ? resultContent.replace(/\n/g, '\r\n')
      : resultContent;

    try {
      fs.writeFileSync(filePath, finalContent, 'utf-8');
    } catch (err) {
      throw new Error(`Failed to write file: ${err.message}`);
    }

    return { success: true, message: 'Fix applied successfully (fuzzy match)' };
  }

  // Direct replacement
  const newContent = normalizedContent.replace(normalizedOriginal, normalizedSuggested);

  // Restore original line endings if file used CRLF
  const finalContent = fileContent.includes('\r\n')
    ? newContent.replace(/\n/g, '\r\n')
    : newContent;

  try {
    fs.writeFileSync(filePath, finalContent, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to write file: ${err.message}`);
  }

  return { success: true, message: 'Fix applied successfully' };
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
    // Continue to extraction methods
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

  // Try to find JSON between curly braces
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    } catch {
      // Continue
    }
  }

  throw new Error('Could not extract valid JSON from response');
}

module.exports = {
  generateFix,
  applyFix,
};
