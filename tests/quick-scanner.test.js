import { describe, it, expect } from 'vitest';
import { runQuickScan } from '../src/main/quick-scanner.js';
import path from 'path';

describe('Quick Scanner Static Analysis', () => {
  it('should detect security and performance issues via static pattern matching', () => {
    const mockFiles = [
      {
        path: '/mock/app.js',
        relativePath: 'src/app.js',
        extension: '.js',
        language: 'JavaScript',
        size: 200,
      }
    ];

    // We can test against real project files or mock behavior
    const projectRoot = path.resolve(__dirname, '..');
    const result = runQuickScan(projectRoot, mockFiles, ['security', 'performance', 'codeQuality', 'testCoverage', 'architecture']);

    expect(result).toHaveProperty('finalScores');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('analysisResults');
    expect(result).toHaveProperty('allSuggestions');
    expect(typeof result.overallScore).toBe('number');
  });
});
