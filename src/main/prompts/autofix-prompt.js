'use strict';

/**
 * Build a prompt for auto-fix code generation.
 * @param {string} code - The original code containing the issue
 * @param {string} issue - Description of the issue to fix
 * @param {string} language - The programming language
 * @returns {string} The complete prompt for the model
 */
function buildAutoFixPrompt(code, issue, language) {
  return `You are an expert ${language} developer. Fix the following issue in the code below.

Issue: ${issue}

Original Code:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Provide the fixed version of the code. Respond with ONLY valid JSON in this exact format (no markdown, no code fences, no extra text):
{
  "fixedCode": "the complete fixed code here",
  "explanation": "Brief explanation of what was changed and why"
}

Rules:
- The fixedCode must be complete, working code — not just the changed lines
- Keep the fix minimal — only change what's necessary to address the issue
- Preserve the original code style, formatting, and comments
- The explanation should be clear and concise
- Do NOT wrap the JSON in markdown code fences
- Respond with ONLY the JSON object, nothing else`;
}

module.exports = {
  buildAutoFixPrompt,
};
