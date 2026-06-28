import { describe, it, expect } from 'vitest';
import { chunkFile, mergeResults } from '../src/main/chunking-service';

describe('chunking-service', () => {
  it('should return single chunk for small files', () => {
    const code = 'const x = 1;\nconsole.log(x);';
    const chunks = chunkFile(code, 'JavaScript');
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(code);
  });

  it('should correctly merge results from multiple chunks', () => {
    const chunkResults = [
      {
        scores: { security: 8, performance: 6 },
        issues: [{ category: 'security', message: 'Issue 1' }],
        suggestions: [{ category: 'security', message: 'Sugg 1' }],
      },
      {
        scores: { security: 10, performance: 8 },
        issues: [{ category: 'performance', message: 'Issue 2' }],
        suggestions: [{ category: 'performance', message: 'Sugg 2' }],
      },
    ];

    const merged = mergeResults(chunkResults);

    expect(merged.scores.security).toBe(9); // (8+10)/2
    expect(merged.scores.performance).toBe(7); // (6+8)/2
    expect(merged.issues.length).toBe(2);
    expect(merged.suggestions.length).toBe(2);
  });
});
