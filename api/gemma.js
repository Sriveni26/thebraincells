/**
 * /api/gemma.js
 * Vercel Serverless Function proxying Google Gemma 4 on the Gemini API.
 * Keeps GEMINI_API_KEY secure in server environment variables.
 * Reference: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
 */

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    // Read API key from server environment or client header
    const authHeader = req.headers['authorization'];
    const clientKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const apiKey = process.env.GEMINI_API_KEY || clientKey;

    if (!apiKey) {
      return res.status(401).json({
        error: 'Missing API Key. Set GEMINI_API_KEY in Vercel Environment Variables or pass via client Settings.'
      });
    }

    const { contents, generationConfig } = req.body || {};
    if (!contents) {
      return res.status(400).json({ error: 'Request body must contain "contents" array.' });
    }

    const modelName = 'gemma-4-26b-a4b-it';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const googleResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: generationConfig || {
          temperature: 0.35,
          topP: 0.95,
          maxOutputTokens: 4096
        }
      })
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Vercel API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
