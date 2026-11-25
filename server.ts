/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Server-side admin passcode security state (in-memory only; never written to plaintext files)
const SESSION_SIGNING_KEY = process.env.ADMIN_SESSION_SECRET
  ? crypto.createHash('sha256').update(process.env.ADMIN_SESSION_SECRET).digest()
  : crypto.randomBytes(32);

let claimedPasscodeRecord: { salt: string; hash: string } | null = null;

const ADMIN_TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || 'unknown';
  return ip;
}

function checkRateLimit(clientKey: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientKey);
  if (!entry || now > entry.resetAt) {
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { allowed: true };
}

function recordFailedAttempt(clientKey: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(clientKey);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(clientKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function clearRateLimit(clientKey: string): void {
  rateLimitStore.delete(clientKey);
}

function isStrongPasscode(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  if (val.length < 12 || val.length > 128) return false;
  if (!/[A-Z]/.test(val)) return false;
  if (!/[a-z]/.test(val)) return false;
  if (!/[0-9]/.test(val)) return false;
  return true;
}

function getEnvAdminPasscode(): string | null {
  const raw = process.env.ADMIN_PASSCODE;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  return null;
}

function constantTimeStringMatch(candidate: string, expected: string): boolean {
  const hashA = crypto.createHash('sha256').update(candidate).digest();
  const hashB = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function signAdminSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      scope: 'admin_console',
      iat: Date.now(),
      exp: Date.now() + ADMIN_TOKEN_TTL_MS,
      nonce: crypto.randomBytes(12).toString('hex'),
    }),
  ).toString('base64url');

  const sig = crypto
    .createHmac('sha256', SESSION_SIGNING_KEY)
    .update(payload)
    .digest('base64url');

  return `${payload}.${sig}`;
}

function verifyAdminSessionToken(token: string): boolean {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || !sig) return false;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SIGNING_KEY)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (parsed.scope !== 'admin_console') return false;
    if (typeof parsed.exp !== 'number' || Date.now() > parsed.exp) return false;
    return true;
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON inputs
  app.use(express.json({ limit: '1mb' }));

  // 1. Server-Side Admin Passcode Auth Routes (Passcode-Only, Server-Verified)
  app.get('/api/admin/status', (_req, res) => {
    const envPasscode = getEnvAdminPasscode();
    if (envPasscode) {
      return res.json({ configured: true, mode: 'env' });
    }
    if (claimedPasscodeRecord) {
      return res.json({ configured: true, mode: 'claimed' });
    }
    return res.json({ configured: false, mode: 'unclaimed' });
  });

  app.post('/api/admin/claim', (req, res) => {
    const clientKey = getClientKey(req);
    const limit = checkRateLimit(clientKey);
    if (!limit.allowed) {
      return res.status(429).json({
        error: `Too many attempts. Please try again in ${limit.retryAfterSec} seconds.`,
      });
    }

    if (getEnvAdminPasscode() || claimedPasscodeRecord) {
      return res.status(409).json({
        error: 'An administrator passcode is already configured.',
      });
    }

    const { passcode } = req.body || {};
    if (!isStrongPasscode(passcode)) {
      recordFailedAttempt(clientKey);
      return res.status(400).json({
        error:
          'Passcode must be at least 12 characters and include uppercase, lowercase, and numeric characters.',
      });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(passcode, salt, 64).toString('hex');
    claimedPasscodeRecord = { salt, hash };
    clearRateLimit(clientKey);

    const adminAuthEmail = (
      process.env.ADMIN_AUTH_EMAIL || 'adereraadenike@gmail.com'
    )
      .trim()
      .toLowerCase();

    return res.json({
      ok: true,
      mode: 'claimed',
      token: signAdminSessionToken(),
      adminAuthEmail,
    });
  });

  app.post('/api/admin/verify-passcode', (req, res) => {
    const clientKey = getClientKey(req);
    const limit = checkRateLimit(clientKey);
    if (!limit.allowed) {
      return res.status(429).json({
        error: `Too many failed attempts. Please wait ${limit.retryAfterSec} seconds before retrying.`,
      });
    }

    const { passcode } = req.body || {};
    if (typeof passcode !== 'string' || passcode.length === 0 || passcode.length > 128) {
      recordFailedAttempt(clientKey);
      return res.status(400).json({ error: 'Please enter a valid passcode.' });
    }

    const adminAuthEmail = (
      process.env.ADMIN_AUTH_EMAIL || 'adereraadenike@gmail.com'
    )
      .trim()
      .toLowerCase();

    const envPasscode = getEnvAdminPasscode();
    if (envPasscode) {
      if (!constantTimeStringMatch(passcode, envPasscode)) {
        recordFailedAttempt(clientKey);
        return res.status(401).json({ error: 'Invalid administrator passcode.' });
      }
      clearRateLimit(clientKey);
      return res.json({
        ok: true,
        token: signAdminSessionToken(),
        adminAuthEmail,
      });
    }

    if (!claimedPasscodeRecord) {
      return res.status(409).json({
        error: 'Administrator passcode has not been initialized yet.',
      });
    }

    const derived = crypto.scryptSync(passcode, claimedPasscodeRecord.salt, 64);
    const stored = Buffer.from(claimedPasscodeRecord.hash, 'hex');
    if (derived.length !== stored.length || !crypto.timingSafeEqual(derived, stored)) {
      recordFailedAttempt(clientKey);
      return res.status(401).json({ error: 'Invalid administrator passcode.' });
    }

    clearRateLimit(clientKey);
    return res.json({
      ok: true,
      token: signAdminSessionToken(),
      adminAuthEmail,
    });
  });

  app.get('/api/admin/verify-session', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!verifyAdminSessionToken(token)) {
      return res.status(401).json({ valid: false });
    }
    return res.json({ valid: true });
  });

  // 2. Server-Side Gemini LLM Endpoint
  app.post('/api/gemini/generate', async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        advice:
          'Your net capital allocations are solid. Diversifying 15% into compound sub-vaults stabilizes liquidity metrics against market shifts and maximizes compound yield.',
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents:
          prompt ||
          'Analyze asset distributions and provide financial wealth advice in two elegant sentences.',
      });

      const text =
        response.text ||
        'Your current checking reserves are optimized. Allocate excess balances into high-yield targets to scale passive growth.';
      res.json({ advice: text.trim() });
    } catch (err: any) {
      console.error('Gemini server error:', err);
      res.json({
        advice:
          'Asset progression is climbing. Consistently sweeping loose card decimals to target sub-reserves shortens milestone timetables.',
      });
    }
  });

  // 3. Vite Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Morning Bright custom server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start Morning Bright server:', err);
});
