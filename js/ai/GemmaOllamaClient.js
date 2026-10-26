/**
 * GemmaOllamaClient.js
 * Integration with local Ollama running `gemma4` at http://127.0.0.1:11434/api/chat.
 */

export class GemmaOllamaClient {
  constructor(endpoint = 'http://127.0.0.1:11434/api/chat') {
    this.endpoint = endpoint;
    this.modelName = 'gemma4';
  }

  setEndpoint(url) {
    this.endpoint = url.trim();
  }

  /**
   * Health check to test if Ollama is actively running and responding
   * @returns {Promise<{online: boolean, models: string[], error?: string}>}
   */
  async checkHealth() {
    try {
      const baseUrl = this.endpoint.replace(/\/api\/.*$/, '');
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        return { online: false, models: [], error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      const models = (data.models || []).map(m => m.name || m.model);
      const hasGemma4 = models.some(m => m.toLowerCase().includes('gemma4') || m.toLowerCase().includes('gemma'));

      return {
        online: true,
        models,
        hasGemma4
      };
    } catch (err) {
      return {
        online: false,
        models: [],
        error: err.message || 'Cannot reach local Ollama endpoint'
      };
    }
  }

  /**
   * Generates response via Ollama /api/chat
   * @param {string} userPrompt - The primary user prompt
   * @param {string} systemInstruction - Optional system instruction
   * @returns {Promise<{json: any, rawText: string, latencyMs: number, tokenCount: number}>}
   */
  async generateContent(userPrompt, systemInstruction = '') {
    const startTime = performance.now();

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: userPrompt });

    const requestBody = {
      model: this.modelName,
      messages: messages,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.35,
        top_p: 0.95
      }
    };

    let response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
    } catch (netErr) {
      throw new Error(`Ollama connection error (${this.endpoint}): ${netErr.message}. Ensure Ollama is running ('ollama serve') and allows CORS ('set OLLAMA_ORIGINS=*').`);
    }

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama API error (HTTP ${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data?.message?.content || '';
    const tokenCount = data?.eval_count || Math.round(rawText.length / 4);

    if (!rawText) {
      throw new Error('Ollama gemma4 returned an empty message.');
    }

    const cleanJson = this._cleanAndParseJson(rawText);

    return {
      json: cleanJson,
      rawText,
      latencyMs,
      tokenCount
    };
  }

  _cleanAndParseJson(text) {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
      cleaned = cleaned.replace(/\s*```$/, '');
    }

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      console.error('Ollama output parsing error:', cleaned);
      throw new Error(`Failed to parse Ollama output as JSON: ${err.message}`);
    }
  }
}
