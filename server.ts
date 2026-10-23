import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { loadConfig } from './src/config.js';
import { createHostPacer, createSlidingWindowLimiter } from './src/limits.js';
import { createScanner } from './src/scan.js';
import { safeFetch } from './src/safeFetch.js';
import { createApp, clientIp } from './src/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');

// Global security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Initialize passive scan service
const scannerConfig = loadConfig();
const pacer = createHostPacer({ spacingMs: scannerConfig.requestSpacingMs });
const scanner = createScanner({ config: scannerConfig, safeFetch, pacer });
const scannerApp = createApp({ config: scannerConfig, scanner });

// MUST mount scanner routes BEFORE express.json() body parser to prevent stream reading hangs
app.use((req, res, next) => {
  const pathname = new URL(req.url || '/', 'http://local').pathname;
  if (pathname === '/healthz' || pathname === '/api/whoami' || pathname === '/api/scan') {
    return scannerApp.listener(req, res);
  }
  next();
});

// Enforce body parsing limit
app.use(express.json({ limit: '64kb' }));

// Anti-Abuse Rate Limiter for AI Companion endpoints (30 requests per minute per client IP)
const geminiLimiter = createSlidingWindowLimiter({
  windowMs: 60_000,
  max: 30,
  now: Date.now,
});

const PORT = 3000;

// Shared Gemini AI instance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Middleware: Verify Bearer token presence and enforce rate limits for Gemini endpoints
function requireAuthAndRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = clientIp(req, scannerConfig.trustProxyHops);
  const gate = geminiLimiter.take(ip);
  if (!gate.ok) {
    res.setHeader('Retry-After', String(Math.ceil(gate.retryAfterMs / 1000)));
    return res.status(429).json({ error: 'Too many companion requests. Please wait a moment before trying again.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.length < 15) {
    return res.status(401).json({ error: 'Unauthorized. You must be signed in to access the Sentinel AI Companion.' });
  }

  next();
}

// API Route: Multi-turn chat with Gemini companion
app.post('/api/gemini/chat', requireAuthAndRateLimit, async (req, res) => {
  try {
    const { messages, systemInstruction, model = 'gemini-3.8-flash' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    if (messages.length > 30) {
      return res.status(400).json({ error: 'Conversation history exceeds allowed length (max 30 messages).' });
    }

    // Input bounds validation
    for (const msg of messages) {
      if (!msg || typeof msg.content !== 'string' || msg.content.length > 5000) {
        return res.status(400).json({ error: 'Message content must be text under 5,000 characters.' });
      }
    }

    const allowedModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.8-flash';

    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction || `You are Sentinel, a digital security companion specializing in vibecoded apps. You help builders understand cybersecurity vulnerabilities, API leaks, authentication gaps, and logic flaws in AI-generated code. Speak with clarity, encouragement, and plain English. Provide copy-paste fix prompts for AI builders (Cursor, Lovable, Bolt, v0) whenever requested.`,
        temperature: 0.7,
      },
    });

    const replyText = response.text || 'I analyzed your request, but could not generate a response. Please try rephrasing.';
    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while communicating with Gemini.' });
  }
});

// API Route: Deep breakdown of a specific security finding
app.post('/api/gemini/breakdown', requireAuthAndRateLimit, async (req, res) => {
  try {
    const { finding, appUrl } = req.body;
    if (!finding || typeof finding !== 'object') {
      return res.status(400).json({ error: 'Valid finding payload object is required.' });
    }

    const safeTitle = String(finding.title || '').slice(0, 200);
    const safeSeverity = String(finding.severity || 'warning').slice(0, 30);
    const safeDesc = String(finding.description || '').slice(0, 2000);
    const safeEvidence = String(finding.evidence || '').slice(0, 4000);
    const safeAppUrl = String(appUrl || 'Target App').slice(0, 300);

    const prompt = `Analyze this cybersecurity finding for the vibecoded app "${safeAppUrl}":
Title: ${safeTitle}
Severity: ${safeSeverity}
Description: ${safeDesc}
Evidence: ${safeEvidence}

Provide a structured analysis in Markdown covering:
1. **What is happening**: A plain English breakdown of the flaw.
2. **Attacker Perspective**: How an exploit works in the wild.
3. **Risk & Business Impact**: What happens if this remains unfixed.
4. **Step-by-Step Fix**: Architectural changes needed.
5. **Ready-to-use AI Prompt**: A concise, copy-paste prompt for Cursor/Lovable/Bolt to patch this flaw immediately.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are Sentinel, an expert digital security companion for vibecoded apps.',
      },
    });

    return res.json({ breakdown: response.text });
  } catch (error: any) {
    console.error('Gemini Breakdown Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred during breakdown generation.' });
  }
});

// Serve frontend with Vite dev middleware or static dist
async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');

  if (process.env.NODE_ENV === 'production' && fs.existsSync(indexHtmlPath)) {
    app.use(express.static(distPath));
    // Express 5.x compatible catch-all for SPA
    app.use((_req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
