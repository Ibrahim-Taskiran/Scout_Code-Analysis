'use strict';

/**
 * Build a chatbot system prompt with optional analysis context.
 * @param {string} userMessage - The user's chat message
 * @param {Object} [context] - Optional context
 * @param {Object} [context.analysisResults] - Analysis results summary
 * @param {Object} [context.languageStats] - User's language statistics from library
 * @returns {string} The complete prompt for the model
 */
function buildChatPrompt(userMessage, context = {}) {
  let systemPrompt = `You are Scout, an intelligent code analysis assistant. You help developers understand their code quality, improve their projects, and learn best practices.

Your capabilities:
1. **Analysis Results**: You can explain analysis results, suggest improvements, and help prioritize fixes.
2. **General Code Questions**: You can answer questions about design patterns, debugging, best practices, algorithms, and any programming topic.
3. **Project Suggestions**: Based on the user's programming experience and language statistics, you can suggest new projects, learning paths, and technologies to explore.

Guidelines:
- CRITICAL: Kullanıcıya HER ZAMAN Türkçe olarak KISA, ÖZ, NET ve DOĞRUDAN yanıt ver. Paragraflarını 1-3 cümle ile sınırla. Gereksiz dolandırma, özet bilgi sun.
- Yalnızca kullanıcı özellikle detaylı açıklama veya kod örneği istediğinde kod bloğu sağla.
- Use markdown formatting for readability.
- If asked about analysis results and you have context, reference specific scores and issues.
- If asked about project suggestions and you have language stats, tailor suggestions to the user's experience.
`;

  // Add analysis context if available
  if (context.analysisResults) {
    const results = context.analysisResults;
    systemPrompt += `\n## Current Analysis Context\n`;

    if (results.projectName) {
      systemPrompt += `Project: ${results.projectName}\n`;
    }

    if (results.overallScore !== undefined) {
      systemPrompt += `Overall Score: ${results.overallScore}/10\n`;
    }

    if (results.categoryScores) {
      systemPrompt += `\nCategory Scores:\n`;
      for (const [category, score] of Object.entries(results.categoryScores)) {
        systemPrompt += `- ${category}: ${score}/10\n`;
      }
    }

    if (results.topIssues && results.topIssues.length > 0) {
      systemPrompt += `\nTop Issues:\n`;
      for (const issue of results.topIssues.slice(0, 10)) {
        systemPrompt += `- [${issue.severity}] ${issue.file}: ${issue.message}\n`;
      }
    }

    if (results.totalFiles !== undefined) {
      systemPrompt += `\nTotal files analyzed: ${results.totalFiles}\n`;
    }

    systemPrompt += `\nUse this context to answer questions about the analysis results.\n`;
  }

  // Add language statistics if available
  if (context.languageStats && Object.keys(context.languageStats).length > 0) {
    systemPrompt += `\n## User's Language Profile\n`;
    systemPrompt += `The user has the following programming language distribution across their projects:\n`;

    const totalFiles = Object.values(context.languageStats).reduce((a, b) => a + b, 0);

    // Sort by count descending
    const sorted = Object.entries(context.languageStats)
      .sort(([, a], [, b]) => b - a);

    for (const [lang, count] of sorted) {
      const percentage = ((count / totalFiles) * 100).toFixed(1);
      systemPrompt += `- ${lang}: ${count} files (${percentage}%)\n`;
    }

    systemPrompt += `\nUse this profile to tailor project suggestions and learning recommendations to the user's experience.\n`;
  }

  // Combine system prompt with user message
  return `${systemPrompt}\n---\n\nUser: ${userMessage}\n\nAssistant:`;
}

module.exports = {
  buildChatPrompt,
};
