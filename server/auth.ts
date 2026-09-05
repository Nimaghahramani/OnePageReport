import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const SESSION_COOKIE_NAME = 'admin_session';
export const SESSION_MAX_AGE_SEC = 24 * 60 * 60; // 24 hours

export interface SessionPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

/**
 * Check if ADMIN_PASSWORD is set in environment (No fallback, no default)
 */
export function isAdminPasswordConfigured(): boolean {
  const pwd = process.env.ADMIN_PASSWORD;
  return Boolean(pwd && pwd.trim().length > 0);
}

/**
 * Resolve Session Secret securely from server environment.
 * In production, ADMIN_SESSION_SECRET is strictly mandatory.
 * Random fallback exists only in non-production local development.
 */
let devGeneratedSecret: string | null = null;
export function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }
  if (process.env.NODE_ENV !== 'production') {
    if (!devGeneratedSecret) {
      devGeneratedSecret = crypto.randomBytes(32).toString('hex');
    }
    return devGeneratedSecret;
  }
  return null;
}

/**
 * Check if ADMIN_SESSION_SECRET is configured
 */
export function isSessionSecretConfigured(): boolean {
  return Boolean(getSessionSecret());
}

/**
 * Verify candidate password against process.env.ADMIN_PASSWORD using constant-time comparison.
 * Must NEVER use hardcoded or fallback passwords.
 * If ADMIN_PASSWORD is missing: returns false (no throw, no default, no auth).
 */
export function verifyAdminPassword(candidate: string): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const target = process.env.ADMIN_PASSWORD;
  if (!target || target.trim() === '') {
    return false;
  }

  const trimmedTarget = target.trim();
  const trimmedCandidate = candidate.trim();

  const safeCompare = (a: string, b: string): boolean => {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  };

  // Compare verbatim or trimmed candidate against target
  return safeCompare(candidate, target) || safeCompare(trimmedCandidate, trimmedTarget);
}

/**
 * Generate a cryptographically signed HMAC token for admin session
 */
export function createAdminSessionToken(): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('ADMIN_CONFIG_MISSING');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    role: 'admin',
    iat: now,
    exp: now + SESSION_MAX_AGE_SEC,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Validate session token and check expiration
 */
export function verifyAdminSessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const secret = getSessionSecret();
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [encodedPayload, providedSignature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSignature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (providedBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return false;

  try {
    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return false; // Expired
    }
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Set HttpOnly session cookie on response
 */
export function setAdminSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SEC * 1000,
    path: '/',
  });
}

/**
 * Clear session cookie on logout
 */
export function clearAdminSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    path: '/',
  });
}

/**
 * Extract token from request (cookies or Authorization header)
 */
export function extractTokenFromRequest(req: Request): string | null {
  if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    return req.cookies[SESSION_COOKIE_NAME];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

/**
 * Express middleware to guard admin-only API routes
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractTokenFromRequest(req);
  if (!token || !verifyAdminSessionToken(token)) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'دسترسی غیرمجاز: احراز هویت مدیر الزامی است.',
    });
    return;
  }
  next();
}
