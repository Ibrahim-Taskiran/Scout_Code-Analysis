'use strict';

/**
 * Category metadata mapping for prompt construction.
 */
const CATEGORY_META = {
  security: {
    name: 'Security',
    emoji: '🔒',
    description: 'Security vulnerabilities, sensitive data exposure, authentication errors, injection attacks, XSS, CSRF, insecure dependencies',
  },
  performance: {
    name: 'Performance',
    emoji: '⚡',
    description: 'Slow algorithms, unnecessary loops, memory leaks, inefficient data structures, N+1 queries, excessive re-renders',
  },
  'code-quality': {
    name: 'Code Quality',
    emoji: '🧹',
    description: 'Code duplication, readability, naming standards, SOLID principles, dead code, magic numbers, function length',
  },
  'test-coverage': {
    name: 'Test Coverage',
    emoji: '🧪',
    description: 'Unit tests, integration tests, test ratio, edge case coverage, mocking practices, test organization',
  },
  architecture: {
    name: 'Architecture',
    emoji: '🏗️',
    description: 'Layered structure, dependency management, modularity, separation of concerns, coupling, cohesion, design patterns',
  },
};

/**
 * Build the analysis prompt for a given code file.
 * @param {string} code - The source code content
 * @param {string} fileName - The file name (relative path)
 * @param {string} language - The programming language
 * @param {string[]} categories - Array of selected category keys
 * @param {string} mode - 'fast' or 'deep'
 * @returns {string} The complete prompt string
 */
function buildAnalysisPrompt(code, fileName, language, categories, mode = 'fast') {
  const selectedCategories = categories
    .filter((cat) => CATEGORY_META[cat])
    .map((cat) => CATEGORY_META[cat]);

  if (selectedCategories.length === 0) {
    // Default to all categories if none are specified
    for (const key of Object.keys(CATEGORY_META)) {
      selectedCategories.push(CATEGORY_META[key]);
    }
  }

  const categoryList = selectedCategories
    .map((cat) => `- ${cat.emoji} **${cat.name}**: ${cat.description}`)
    .join('\n');

  const categoryKeys = categories.length > 0
    ? categories.filter((cat) => CATEGORY_META[cat])
    : Object.keys(CATEGORY_META);

  const scoresExample = categoryKeys
    .map((key) => `"${key}": 7`)
    .join(', ');

  if (mode === 'deep') {
    return buildDeepPrompt(code, fileName, language, categoryList, scoresExample, categoryKeys);
  }

  return buildFastPrompt(code, fileName, language, categoryList, scoresExample, categoryKeys);
}

/**
 * Build the Fast Mode analysis prompt.
 */
function buildFastPrompt(code, fileName, language, categoryList, scoresExample, categoryKeys) {
  return `You are an expert code reviewer. Analyze the following ${language} code from file "${fileName}".

Evaluate the code across these categories:
${categoryList}

Score each category from 0 to 10 (10 = perfect).
Focus on the most critical issues only. Be concise.

Respond with ONLY valid JSON in this exact format (no markdown, no code fences, no extra text):
{
  "scores": {${scoresExample}},
  "issues": [
    {
      "category": "${categoryKeys[0]}",
      "severity": "high",
      "file": "${fileName}",
      "line": 1,
      "message": "Description of the issue",
      "code": "problematic code snippet"
    }
  ],
  "suggestions": [
    {
      "category": "${categoryKeys[0]}",
      "file": "${fileName}",
      "message": "What should be improved",
      "originalCode": "current code",
      "suggestedCode": "improved code"
    }
  ]
}

Rules:
- CRITICAL: All "message" fields inside "issues" and "suggestions" MUST BE WRITTEN IN TURKISH (TÜRKÇE). (Tüm açıklama ve mesajları kesinlikle Türkçe yaz).
- Only include the categories listed above in "scores"
- "severity" must be one of: "critical", "high", "medium", "low"
- Include only the most important issues (max 5)
- Include only the most impactful suggestions (max 3)
- If the code is good in a category, give a high score and skip issues for that category
- Respond with ONLY the JSON object, nothing else

Code to analyze:
\`\`\`${language.toLowerCase()}
${code}
\`\`\``;
}

/**
 * Build the Deep Mode analysis prompt.
 */
function buildDeepPrompt(code, fileName, language, categoryList, scoresExample, categoryKeys) {
  return `You are a senior software engineer performing an in-depth code review. Analyze the following ${language} code from file "${fileName}" thoroughly.

Evaluate the code across these categories with detailed analysis:
${categoryList}

Score each category from 0 to 10 (10 = perfect).
Be thorough and detailed. Examine every function, class, and logic path.

Respond with ONLY valid JSON in this exact format (no markdown, no code fences, no extra text):
{
  "scores": {${scoresExample}},
  "issues": [
    {
      "category": "${categoryKeys[0]}",
      "severity": "high",
      "file": "${fileName}",
      "line": 1,
      "message": "Detailed description of the issue and why it matters",
      "code": "problematic code snippet"
    }
  ],
  "suggestions": [
    {
      "category": "${categoryKeys[0]}",
      "file": "${fileName}",
      "message": "Detailed description of the improvement and its benefits",
      "originalCode": "current problematic code",
      "suggestedCode": "improved code with the fix applied"
    }
  ]
}

Rules:
- CRITICAL: All "message" fields inside "issues" and "suggestions" MUST BE WRITTEN IN TURKISH (TÜRKÇE). (Tüm açıklama ve mesajları kesinlikle Türkçe yaz).
- Only include the categories listed above in "scores"
- "severity" must be one of: "critical", "high", "medium", "low"
- Be thorough: report ALL issues you find, not just the top ones
- For each issue, explain WHY it's a problem and what could go wrong
- Provide complete, working code in suggestions (not just pseudocode)
- Include line numbers where applicable
- Consider edge cases, error handling, and maintainability
- If the code is good in a category, explain briefly why and give a high score
- Respond with ONLY the JSON object, nothing else

Code to analyze:
\`\`\`${language.toLowerCase()}
${code}
\`\`\``;
}

module.exports = {
  buildAnalysisPrompt,
  CATEGORY_META,
};
