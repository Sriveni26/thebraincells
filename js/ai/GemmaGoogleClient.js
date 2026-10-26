/**
 * GemmaGoogleClient.js
 * Integration with Google's hosted `gemma-4-26b-a4b-it` model via the official Gemini API endpoint.
 * Documentation Reference: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
 */

export class GemmaGoogleClient {
  constructor(apiKey = '') {
    this.apiKey = apiKey;
    this.modelName = 'gemma-4-26b-a4b-it';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  setApiKey(key) {
    this.apiKey = key.trim();
  }

  hasApiKey() {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  /**
   * Generates content from Google's hosted Gemma 4 model
   * @param {string} userPrompt - The primary user prompt
   * @param {string} systemInstruction - Optional system guidance
   * @returns {Promise<{json: any, rawText: string, latencyMs: number, tokenCount: number}>}
   */
    const startTime = performance.now();
    const combinedPrompt = systemInstruction 
      ? `${systemInstruction}\n\n---\n\n${userPrompt}` 
      : userPrompt;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: combinedPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.35,
        topP: 0.95,
        maxOutputTokens: 4096
      }
    };

    let response;
    // Check if hosted on Vercel or supporting serverless /api/gemma endpoint
    const isVercelHost = window.location.hostname.includes('vercel.app') || window.location.port === '';
    const useVercelProxy = isVercelHost && (!this.hasApiKey() || !this.apiKey);

    if (useVercelProxy) {
      try {
        response = await fetch('/api/gemma', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.hasApiKey() ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
          },
          body: JSON.stringify(requestBody)
        });
      } catch (err) {
        console.warn('Vercel proxy unreachable, falling back to direct API call:', err);
      }
    }

    if (!response) {
      if (!this.hasApiKey()) {
        throw new Error('Google Gemini API Key is missing. Please configure it in Settings or set GEMINI_API_KEY in Vercel.');
      }
      const endpoint = `${this.baseUrl}/${this.modelName}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
      } catch (networkError) {
        throw new Error(`Failed to connect to Google API: ${networkError.message}`);
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { error: { message: errorText } };
      }
      const message = errorJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Google Gemma API Error: ${message}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokenCount = data?.usageMetadata?.totalTokenCount || Math.round(rawText.length / 4);

    if (!rawText) {
      throw new Error('Google Gemma model returned an empty text response.');
    }

    // Extract JSON safely
    const cleanJson = this._cleanAndParseJson(rawText);

    return {
      json: cleanJson,
      rawText,
      latencyMs,
      tokenCount
    };
  }

  /**
   * Strips markdown fences and parses JSON safely
   */
  _cleanAndParseJson(text) {
    let cleaned = text.trim();
    // Remove markdown code fences like ```json ... ``` or ``` ... ```
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
      cleaned = cleaned.replace(/\s*```$/, '');
    }

    // Find JSON boundaries in case there is preamble
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      console.error('Raw string failed JSON parse:', cleaned);
      throw new Error(`Model output could not be parsed as valid JSON: ${err.message}`);
    }
  }
}
