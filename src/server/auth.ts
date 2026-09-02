import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/publishedReport';

// In-memory process fallback secret if ADMIN_SESSION_SECRET is not provided
const PROCESS_RANDOM_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || PROCESS_RANDOM_SECRET;
}

export function isPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0);
}

export function verifyAdminPassword(providedPassword: string): { success: boolean; message?: string } {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword || configuredPassword.trim().length === 0) {
    return {
      success: false,
      message: 'رمز عبور مدیریت در متغیرهای محیطی سرور (ADMIN_PASSWORD) پیکربندی نشده است. لطفاً متغیر محیطی ADMIN_PASSWORD را در تنظیمات سرور تنظیم نمایید.'
    };
  }

  // Use timingSafeEqual to prevent timing attacks
  const bufA = Buffer.from(providedPassword.normalize());
  const bufB = Buffer.from(configuredPassword.normalize());

  if (bufA.length !== bufB.length) {
    return {
      success: false,
      message: 'کلمه عبور مدیریت نادرست است.'
    };
  }

  const isMatch = crypto.timingSafeEqual(bufA, bufB);
  if (!isMatch) {
    return {
      success: false,
      message: 'کلمه عبور مدیریت نادرست است.'
    };
  }

  return { success: true };
}

interface AdminSessionPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}

export function generateAdminSessionToken(expirationSeconds = 86400): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    sub: 'admin',
    role: 'Administrator',
    iat: now,
    exp: now + expirationSeconds,
    jti: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex')
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureData = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac('sha256', getSessionSecret());
  hmac.update(signatureData);
  const signature = hmac.digest('base64url');

  return `${signatureData}.${signature}`;
}

export function verifyAdminSessionToken(token: string): { valid: boolean; payload?: AdminSessionPayload; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'توکن ارائه نشده است.' };
  }

  // Reject any unverified or fake prefix patterns
  if (token.startsWith('loico_admin_') || token.startsWith('dev_admin_') || !token.includes('.')) {
    return { valid: false, error: 'ساختار توکن نامعتبر است.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'فرمت توکن نشست نامعتبر است.' };
  }

  const [encodedHeader, encodedPayload, providedSignature] = parts;
  const signatureData = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac('sha256', getSessionSecret());
  hmac.update(signatureData);
  const expectedSignature = hmac.digest('base64url');

  const bufProvided = Buffer.from(providedSignature);
  const bufExpected = Buffer.from(expectedSignature);

  if (bufProvided.length !== bufExpected.length || !crypto.timingSafeEqual(bufProvided, bufExpected)) {
    return { valid: false, error: 'امضای توکن نامعتبر است یا دستکاری شده است.' };
  }

  try {
    const payload: AdminSessionPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'نشست مدیریت منقضی شده است. لطفاً مجدداً وارد شوید.' };
    }

    if (payload.sub !== 'admin') {
      return { valid: false, error: 'هویت کاربر توکن نامعتبر است.' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'خطا در رمزگشایی محتوای توکن نشست.' };
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  let token: string | null = null;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check HttpOnly session cookie
  if (!token && req.cookies && req.cookies.loico_admin_session) {
    token = req.cookies.loico_admin_session;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'برای دسترسی به این بخش، ورود به پنل مدیریت الزامی است.'
      }
    } as ApiResponse);
  }

  const verification = verifyAdminSessionToken(token);
  if (!verification.valid) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: verification.error || 'توکن اعتبارسنجی مدیریت نامعتبر یا منقضی شده است.'
      }
    } as ApiResponse);
  }

  (req as any).adminUser = verification.payload;
  next();
}
