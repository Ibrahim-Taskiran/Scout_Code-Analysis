'use strict';

const OLLAMA_BASE_URL = 'http://localhost:11434';

// Analysis timeout: 120 seconds
const ANALYSIS_TIMEOUT_MS = 120000;

/**
 * Check if Ollama is running and return available models.
 * @returns {Promise<{running: boolean, models: Array}>}
 */
async function checkConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { running: false, models: [] };
    }

    const data = await response.json();
    const models = (data.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      modifiedAt: m.modified_at,
      digest: m.digest,
    }));

    return { running: true, models };
  } catch (err) {
    return { running: false, models: [] };
  }
}

/**
 * Generate a non-streaming analysis response from Ollama.
 * @param {string} prompt - The analysis prompt
 * @param {string} model - Model name (e.g., 'deepseek-coder:6.7b')
 * @returns {Promise<string>} The response text
 */
async function generateAnalysis(prompt, model) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 4096,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.response || '';
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Analysis request timed out after 120 seconds');
    }
    throw err;
  }
}

let activeChatController = null;

function stopChat() {
  if (activeChatController) {
    activeChatController.abort();
    activeChatController = null;
  }
}

/**
 * Stream a chat response from Ollama, calling onChunk for each token.
 * @param {string} prompt - The user message
 * @param {string} model - Model name
 * @param {number[]|null} conversationContext - Ollama context array for multi-turn chat
 * @param {Function} onChunk - Callback: ({chunk: string, done: boolean, context?: number[]})
 * @returns {Promise<number[]>} Updated context for next message
 */
async function streamChat(prompt, model, conversationContext, onChunk) {
  stopChat(); // Cancel any existing active chat stream
  activeChatController = new AbortController();

  const body = {
    model,
    prompt,
    stream: true,
    options: {
      temperature: 0.6,
      num_predict: 300,
    },
  };

  if (conversationContext && conversationContext.length > 0) {
    body.context = conversationContext;
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: activeChatController.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama streaming error (${response.status}): ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let lastContext = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.context) lastContext = parsed.context;

            onChunk({
              chunk: parsed.response || '',
              done: parsed.done || false,
            });

            if (parsed.done) return lastContext || [];
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          if (parsed.context) lastContext = parsed.context;
          onChunk({
            chunk: parsed.response || '',
            done: parsed.done || false,
          });
        } catch {
          // Ignore
        }
      }
    } finally {
      reader.releaseLock();
    }

    return lastContext || [];
  } catch (err) {
    if (err.name === 'AbortError') {
      onChunk({ chunk: '\n\n[İşlem durduruldu.]', done: true });
      return [];
    }
    throw err;
  }
}

/**
 * List all locally available models.
 * @returns {Promise<Array>} Array of model objects
 */
async function listModels() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = await response.json();
    return (data.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      modifiedAt: m.modified_at,
      digest: m.digest,
      details: m.details || {},
    }));
  } catch (err) {
    console.error('[OllamaService] listModels error:', err.message);
    throw err;
  }
}

/**
 * Pull a model from the Ollama library with progress streaming.
 * @param {string} modelName - Model name to pull (e.g., 'deepseek-coder:6.7b')
 * @param {Function} onProgress - Callback: ({status, completed, total, digest})
 */
async function pullModel(modelName, onProgress) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: modelName,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to pull model ${modelName}: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);

          let percent = 0;
          if (parsed.total && parsed.completed) {
            percent = Math.round((parsed.completed / parsed.total) * 100);
          }

          onProgress({
            status: parsed.status || '',
            completed: parsed.completed || 0,
            total: parsed.total || 0,
            digest: parsed.digest || '',
            percent,
          });
        } catch {
          // Skip malformed lines
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        onProgress({
          status: parsed.status || 'complete',
          completed: parsed.completed || 0,
          total: parsed.total || 0,
          digest: parsed.digest || '',
          percent: 100,
        });
      } catch {
        // Ignore
      }
    }
  } finally {
    reader.releaseLock();
  }
}

module.exports = {
  OLLAMA_BASE_URL,
  checkConnection,
  generateAnalysis,
  streamChat,
  stopChat,
  listModels,
  pullModel,
};
