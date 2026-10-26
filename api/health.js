/**
 * /api/health.js
 * Vercel Serverless health check and deployment status.
 */

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    platform: 'LearnPlay',
    model: 'gemma-4-26b-a4b-it',
    serverless: true,
    hasServerApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
}
