'use strict';

const MAX_CHUNK_SIZE = 3000; // lines

/**
 * Language-specific regex patterns for function/class boundaries.
 * These patterns match common declaration patterns to find good split points.
 */
const BOUNDARY_PATTERNS = {
  JavaScript: [
    /^(?:export\s+)?(?:async\s+)?function\s+\w+/,
    /^(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\(/,
    /^(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?function/,
    /^(?:export\s+)?class\s+\w+/,
    /^module\.exports/,
  ],
  TypeScript: [
    /^(?:export\s+)?(?:async\s+)?function\s+\w+/,
    /^(?:export\s+)?(?:const|let|var)\s+\w+\s*[=:]/,
    /^(?:export\s+)?class\s+\w+/,
    /^(?:export\s+)?interface\s+\w+/,
    /^(?:export\s+)?type\s+\w+/,
    /^(?:export\s+)?enum\s+\w+/,
  ],
  Python: [
    /^def\s+\w+/,
    /^async\s+def\s+\w+/,
    /^class\s+\w+/,
    /^@\w+/,
  ],
  Java: [
    /^\s*(?:public|private|protected|static|final|abstract)\s+.*(?:class|interface|enum)\s+\w+/,
    /^\s*(?:public|private|protected|static|final|synchronized|abstract)\s+\w+.*\s+\w+\s*\(/,
  ],
  'C#': [
    /^\s*(?:public|private|protected|internal|static|virtual|override|abstract|sealed)\s+.*(?:class|interface|struct|enum)\s+\w+/,
    /^\s*(?:public|private|protected|internal|static|virtual|override|abstract|async)\s+\w+.*\s+\w+\s*\(/,
    /^\s*namespace\s+\w+/,
  ],
  Go: [
    /^func\s+(?:\(\w+\s+\*?\w+\)\s+)?\w+\s*\(/,
    /^type\s+\w+\s+(?:struct|interface)/,
    /^package\s+\w+/,
  ],
  Rust: [
    /^(?:pub\s+)?fn\s+\w+/,
    /^(?:pub\s+)?struct\s+\w+/,
    /^(?:pub\s+)?enum\s+\w+/,
    /^(?:pub\s+)?trait\s+\w+/,
    /^(?:pub\s+)?impl\s+/,
    /^mod\s+\w+/,
  ],
  'C++': [
    /^(?:class|struct|namespace)\s+\w+/,
    /^\w+(?:::\w+)*\s+\w+\s*\(/,
    /^template\s*</,
  ],
  C: [
    /^\w+\s+\w+\s*\(/,
    /^(?:struct|enum|union|typedef)\s+/,
  ],
  Ruby: [
    /^(?:def|class|module)\s+\w+/,
  ],
  PHP: [
    /^(?:public|private|protected|static)?\s*function\s+\w+/,
    /^class\s+\w+/,
    /^namespace\s+/,
  ],
  Swift: [
    /^(?:func|class|struct|enum|protocol|extension)\s+\w+/,
    /^(?:public|private|internal|fileprivate|open)\s+(?:func|class|struct)/,
  ],
  Kotlin: [
    /^(?:fun|class|object|interface|enum\s+class)\s+\w+/,
    /^(?:public|private|internal|protected)\s+(?:fun|class)/,
  ],
  Dart: [
    /^(?:class|enum|mixin|extension)\s+\w+/,
    /^\w+\s+\w+\s*\(/,
  ],
};

/**
 * Get boundary patterns for a given language.
 * Falls back to generic patterns for unsupported languages.
 * @param {string} language
 * @returns {RegExp[]}
 */
function getBoundaryPatterns(language) {
  // Check direct match
  if (BOUNDARY_PATTERNS[language]) {
    return BOUNDARY_PATTERNS[language];
  }

  // Map some aliases
  const aliases = {
    'React': BOUNDARY_PATTERNS.JavaScript,
    'React TypeScript': BOUNDARY_PATTERNS.TypeScript,
    'Vue': BOUNDARY_PATTERNS.JavaScript,
    'Svelte': BOUNDARY_PATTERNS.JavaScript,
    'SCSS': [],
    'CSS': [],
    'HTML': [],
    'JSON': [],
    'YAML': [],
    'Markdown': [],
    'Shell': [/^function\s+\w+/, /^\w+\s*\(\)\s*\{/],
    'SQL': [/^CREATE\s+/i, /^ALTER\s+/i, /^DROP\s+/i],
  };

  return aliases[language] || [];
}

/**
 * Find line indices that represent function/class boundaries.
 * @param {string[]} lines - Array of source code lines
 * @param {string} language - Programming language
 * @returns {number[]} Sorted array of boundary line indices
 */
function findBoundaries(lines, language) {
  const patterns = getBoundaryPatterns(language);
  const boundaries = [0]; // Always include the start

  if (patterns.length === 0) {
    return boundaries;
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) {
        boundaries.push(i);
        break;
      }
    }
  }

  return [...new Set(boundaries)].sort((a, b) => a - b);
}

/**
 * Split file content into chunks at logical boundaries.
 * @param {string} fileContent - The entire file content
 * @param {string} language - Programming language name
 * @returns {string[]} Array of code chunks
 */
function chunkFile(fileContent, language) {
  const lines = fileContent.split('\n');

  // If file is small enough, return as a single chunk
  if (lines.length <= MAX_CHUNK_SIZE) {
    return [fileContent];
  }

  const chunks = [];

  // Strategy 1: Try splitting at function/class boundaries
  const boundaries = findBoundaries(lines, language);

  if (boundaries.length > 1) {
    let currentChunkLines = [];

    for (let i = 0; i < boundaries.length; i++) {
      const start = boundaries[i];
      const end = i + 1 < boundaries.length ? boundaries[i + 1] : lines.length;
      const segment = lines.slice(start, end);

      // Check if adding this segment exceeds MAX_CHUNK_SIZE
      if (currentChunkLines.length + segment.length > MAX_CHUNK_SIZE && currentChunkLines.length > 0) {
        chunks.push(currentChunkLines.join('\n'));
        currentChunkLines = segment;
      } else {
        currentChunkLines.push(...segment);
      }
    }

    if (currentChunkLines.length > 0) {
      chunks.push(currentChunkLines.join('\n'));
    }

    // Validate: if we got reasonable chunks, return them
    if (chunks.length > 1) {
      return chunks;
    }
  }

  // Strategy 2: Split at blank lines
  const blankLineChunks = splitAtBlankLines(lines);
  if (blankLineChunks.length > 1) {
    return blankLineChunks;
  }

  // Strategy 3: Last resort — split every MAX_CHUNK_SIZE lines
  return splitEveryN(lines, MAX_CHUNK_SIZE);
}

/**
 * Split lines at blank line boundaries, respecting MAX_CHUNK_SIZE.
 * @param {string[]} lines
 * @returns {string[]}
 */
function splitAtBlankLines(lines) {
  const chunks = [];
  let currentChunkLines = [];

  for (let i = 0; i < lines.length; i++) {
    currentChunkLines.push(lines[i]);

    // Check if we're at a blank line and the chunk is large enough
    if (lines[i].trim() === '' && currentChunkLines.length >= MAX_CHUNK_SIZE / 2) {
      if (currentChunkLines.length > 0) {
        chunks.push(currentChunkLines.join('\n'));
        currentChunkLines = [];
      }
    }

    // Force split if we exceed MAX_CHUNK_SIZE
    if (currentChunkLines.length >= MAX_CHUNK_SIZE) {
      chunks.push(currentChunkLines.join('\n'));
      currentChunkLines = [];
    }
  }

  if (currentChunkLines.length > 0) {
    chunks.push(currentChunkLines.join('\n'));
  }

  return chunks;
}

/**
 * Split lines into chunks of exactly N lines.
 * @param {string[]} lines
 * @param {number} n
 * @returns {string[]}
 */
function splitEveryN(lines, n) {
  const chunks = [];
  for (let i = 0; i < lines.length; i += n) {
    const chunk = lines.slice(i, Math.min(i + n, lines.length));
    chunks.push(chunk.join('\n'));
  }
  return chunks;
}

/**
 * Merge analysis results from multiple chunks into a single result.
 * Averages scores and concatenates issues/suggestions.
 * @param {Array} chunkResults - Array of {scores, issues, suggestions}
 * @returns {{scores: Object, issues: Array, suggestions: Array}}
 */
function mergeResults(chunkResults) {
  if (!chunkResults || chunkResults.length === 0) {
    return { scores: {}, issues: [], suggestions: [] };
  }

  if (chunkResults.length === 1) {
    return chunkResults[0];
  }

  // Merge scores: average across all chunks
  const scoreAccumulator = {};
  const scoreCounts = {};

  for (const result of chunkResults) {
    if (result.scores) {
      for (const [category, score] of Object.entries(result.scores)) {
        if (typeof score === 'number') {
          scoreAccumulator[category] = (scoreAccumulator[category] || 0) + score;
          scoreCounts[category] = (scoreCounts[category] || 0) + 1;
        }
      }
    }
  }

  const scores = {};
  for (const category of Object.keys(scoreAccumulator)) {
    scores[category] = Math.round(
      (scoreAccumulator[category] / scoreCounts[category]) * 10
    ) / 10;
  }

  // Merge issues: concatenate all
  const issues = [];
  for (const result of chunkResults) {
    if (Array.isArray(result.issues)) {
      issues.push(...result.issues);
    }
  }

  // Merge suggestions: concatenate all
  const suggestions = [];
  for (const result of chunkResults) {
    if (Array.isArray(result.suggestions)) {
      suggestions.push(...result.suggestions);
    }
  }

  return { scores, issues, suggestions };
}

module.exports = {
  MAX_CHUNK_SIZE,
  chunkFile,
  mergeResults,
};
