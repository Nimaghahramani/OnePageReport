import { Router, Request, Response } from 'express';
import {
  isAdminPasswordConfigured,
  isSessionSecretConfigured,
  verifyAdminPassword,
  createAdminSessionToken,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  extractTokenFromRequest,
  verifyAdminSessionToken,
  requireAdminAuth,
} from './auth';
import {
  isVercelBlobConfigured,
  isProduction,
  getLatestPublishedReport,
  getLatestReportVersionInfo,
  savePublishedReport,
  getPublicationHistory,
  rollbackToVersion,
} from './storage';
import { validateReportForPublication } from './validator';
import { PublishedReport } from '../src/types';

export const apiRouter = Router();

// Cache-control helper for public endpoints
const setNoCacheHeaders = (res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

// ==========================================
// 1. PUBLIC ENDPOINTS (NO AUTH REQUIRED)
// ==========================================

/**
 * GET /api/health
 * Lightweight health check: always returns success without accessing Blob or Admin secrets.
 */
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'loico-report-api',
  });
});

/**
 * GET /api/report/latest
 * Public access: returns the latest officially published report from Vercel Blob.
 * If no report has ever been published: returns HTTP 200 with { success: true, data: null, message: "NO_PUBLISHED_REPORT" }.
 */
apiRouter.get('/report/latest', async (_req: Request, res: Response) => {
  setNoCacheHeaders(res);
  try {
    const report = await getLatestPublishedReport();
    if (!report) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'NO_PUBLISHED_REPORT',
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    if (err?.code === 'STORAGE_CONFIG_MISSING' || err?.message === 'STORAGE_CONFIG_MISSING') {
      res.status(500).json({
        success: false,
        error: 'STORAGE_CONFIG_MISSING',
        message: 'تنظیمات فضای ذخیره‌سازی ابری (BLOB_READ_WRITE_TOKEN) در متغیرهای سرور یافت نشد.',
      });
      return;
    }
    console.error('[API] /report/latest error:', err);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'خطا در دریافت آخرین گزارش از سرور.',
    });
  }
});

// Alias for plural /reports/latest
apiRouter.get('/reports/latest', async (_req: Request, res: Response) => {
  setNoCacheHeaders(res);
  try {
    const report = await getLatestPublishedReport();
    if (!report) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'NO_PUBLISHED_REPORT',
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    if (err?.code === 'STORAGE_CONFIG_MISSING' || err?.message === 'STORAGE_CONFIG_MISSING') {
      res.status(500).json({
        success: false,
        error: 'STORAGE_CONFIG_MISSING',
        message: 'تنظیمات فضای ذخیره‌سازی ابری (BLOB_READ_WRITE_TOKEN) در متغیرهای سرور یافت نشد.',
      });
      return;
    }
    console.error('[API] /reports/latest error:', err);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'خطا در دریافت آخرین گزارش از سرور.',
    });
  }
});

/**
 * GET /api/report/version
 * Public access: lightweight version check for client auto-polling every 5 minutes
 */
apiRouter.get('/report/version', async (_req: Request, res: Response) => {
  setNoCacheHeaders(res);
  try {
    const versionInfo = await getLatestReportVersionInfo();
    res.status(200).json(versionInfo);
  } catch (err: any) {
    if (err?.code === 'STORAGE_CONFIG_MISSING' || err?.message === 'STORAGE_CONFIG_MISSING') {
      res.status(500).json({
        success: false,
        hasReport: false,
        error: 'STORAGE_CONFIG_MISSING',
      });
      return;
    }
    console.error('[API] /report/version error:', err);
    res.status(500).json({
      success: false,
      hasReport: false,
      error: 'SERVER_ERROR',
    });
  }
});

// ==========================================
// 2. ADMIN AUTHENTICATION
// ==========================================

/**
 * POST /api/admin/login
 * Distinguishes:
 * - wrong password -> 401 INVALID_CREDENTIALS
 * - missing ADMIN_PASSWORD -> 500 ADMIN_CONFIG_MISSING
 * - missing ADMIN_SESSION_SECRET (in production) -> 500 ADMIN_CONFIG_MISSING
 * - server error -> controlled SERVER_ERROR
 */
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  try {
    const { password } = req.body || {};

    // 1. Missing password in payload
    if (!password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: 'MISSING_PASSWORD',
        message: 'لطفاً رمز عبور را وارد نمایید.',
      });
      return;
    }

    // 2. Check if ADMIN_PASSWORD is configured
    if (!isAdminPasswordConfigured()) {
      res.status(500).json({
        success: false,
        error: 'ADMIN_CONFIG_MISSING',
        message: 'پیکربندی رمز عبور مدیر (ADMIN_PASSWORD) در محیط سرور تنظیم نشده است.',
      });
      return;
    }

    // 3. Check if ADMIN_SESSION_SECRET is configured
    if (!isSessionSecretConfigured()) {
      res.status(500).json({
        success: false,
        error: 'ADMIN_CONFIG_MISSING',
        message: 'پیکربندی کلید امنیتی نشست (ADMIN_SESSION_SECRET) در محیط سرور تنظیم نشده است.',
      });
      return;
    }

    // 4. Verify password
    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      setTimeout(() => {
        res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'رمز عبور مدیریت نادرست است.',
        });
      }, 300);
      return;
    }

    // 5. Create and set session token
    const token = createAdminSessionToken();
    setAdminSessionCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'ورود به پنل مدیریت با موفقیت انجام شد.',
      user: {
        role: 'admin',
        name: 'مدیر ارشد پروژه',
      },
    });
  } catch (err: any) {
    console.error('[API] /admin/login error:', err);
    if (err?.message === 'ADMIN_CONFIG_MISSING') {
      res.status(500).json({
        success: false,
        error: 'ADMIN_CONFIG_MISSING',
        message: 'پیکربندی امنیتی مدیر در محیط سرور یافت نشد.',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'خطای سرور در پردازش درخواست ورود.',
    });
  }
});

/**
 * POST /api/admin/logout
 * Clears HttpOnly session cookie
 */
apiRouter.post('/admin/logout', (_req: Request, res: Response) => {
  clearAdminSessionCookie(res);
  res.status(200).json({
    success: true,
    message: 'خروج از پنل مدیریت انجام شد.',
  });
});

/**
 * GET /api/admin/me
 * Check current authentication state
 */
apiRouter.get('/admin/me', (req: Request, res: Response) => {
  const token = extractTokenFromRequest(req);
  if (!token || !verifyAdminSessionToken(token)) {
    res.status(200).json({
      success: true,
      authenticated: false,
    });
    return;
  }

  res.status(200).json({
    success: true,
    authenticated: true,
    user: {
      role: 'admin',
      name: 'مدیر ارشد پروژه',
    },
  });
});

// ==========================================
// 3. PROTECTED ADMIN ACTIONS
// ==========================================

/**
 * POST /api/admin/validate
 * Server-side validation of draft report prior to publishing
 */
apiRouter.post('/admin/validate', requireAdminAuth, (req: Request, res: Response) => {
  const draftReport: Partial<PublishedReport> = req.body;
  if (!draftReport) {
    res.status(400).json({
      success: false,
      error: 'MISSING_BODY',
      message: 'داده‌ای برای اعتبارسنجی ارسال نشده است.',
    });
    return;
  }

  const result = validateReportForPublication(draftReport);
  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * POST /api/admin/publish
 * Server-side publication workflow:
 * 1. Verify admin session (handled by requireAdminAuth middleware)
 * 2. Validate normalized draft report
 * 3. Assign next version
 * 4. Save immutable snapshot in central storage (Vercel Blob in prod)
 * 5. Update latest-report pointer and history
 */
apiRouter.post('/admin/publish', requireAdminAuth, async (req: Request, res: Response) => {
  const draftReport: Partial<PublishedReport> = req.body;
  if (!draftReport) {
    res.status(400).json({
      success: false,
      error: 'MISSING_PAYLOAD',
      message: 'داده‌های پیش‌نویس گزارش جهت انتشار ارسال نشده است.',
    });
    return;
  }

  // 1. Strict Server-Side Validation
  const validation = validateReportForPublication(draftReport);
  if (!validation.isValid) {
    res.status(422).json({
      success: false,
      error: 'VALIDATION_FAILED',
      message: 'انتشار گزارش به دلیل خطاهای اعتبارسنجی رد شد.',
      errors: validation.errors,
      warnings: validation.warnings,
    });
    return;
  }

  try {
    const reportToPublish = draftReport as PublishedReport;
    reportToPublish.publishedBy = 'مدیر ارشد پروژه';

    const saveResult = await savePublishedReport(reportToPublish);

    res.status(200).json({
      success: true,
      message: `گزارش نسخه ${saveResult.version} با موفقیت در مخزن ابری منتشر گردید.`,
      version: saveResult.version,
      id: saveResult.report.id,
      publishedAt: saveResult.report.publishedAt,
      report: saveResult.report,
    });
  } catch (err: any) {
    console.error('[API] /admin/publish error:', err);
    if (err?.code === 'STORAGE_CONFIG_MISSING' || err?.message === 'STORAGE_CONFIG_MISSING') {
      res.status(500).json({
        success: false,
        error: 'STORAGE_CONFIG_MISSING',
        message: 'تنظیمات فضای ذخیره‌سازی ابری (BLOB_READ_WRITE_TOKEN) در متغیرهای سرور یافت نشد.',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'PUBLISH_STORAGE_ERROR',
      message: 'خطا در ذخیره‌سازی نسخه نهایی گزارش در فضای ابری.',
    });
  }
});

/**
 * GET /api/admin/history
 * Retrieve immutable publication history and audit versions
 */
apiRouter.get('/admin/history', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const history = await getPublicationHistory();
    res.status(200).json({
      success: true,
      history,
    });
  } catch (err: any) {
    console.error('[API] /admin/history error:', err);
    if (err?.code === 'STORAGE_CONFIG_MISSING' || err?.message === 'STORAGE_CONFIG_MISSING') {
      res.status(500).json({
        success: false,
        error: 'STORAGE_CONFIG_MISSING',
        message: 'تنظیمات فضای ذخیره‌سازی ابری (BLOB_READ_WRITE_TOKEN) در متغیرهای سرور یافت نشد.',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'STORAGE_ERROR',
      message: 'خطا در بارگذاری تاریخچه انتشار.',
    });
  }
});

/**
 * POST /api/admin/rollback
 * Roll back latest pointer to an earlier published snapshot
 */
apiRouter.post('/admin/rollback', requireAdminAuth, async (req: Request, res: Response) => {
  const { version } = req.body || {};
  if (!version || typeof version !== 'number') {
    res.status(400).json({
      success: false,
      error: 'INVALID_VERSION',
      message: 'شماره نسخه معتبر نیست.',
    });
    return;
  }

  try {
    const restored = await rollbackToVersion(version);
    if (!restored) {
      res.status(404).json({
        success: false,
        error: 'VERSION_NOT_FOUND',
        message: `نسخه ${version} در بایگانی سیستم یافت نشد.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `گزارش با موفقیت به نسخه ${version} بازگردانی شد.`,
      report: restored,
    });
  } catch (err: any) {
    console.error('[API] /admin/rollback error:', err);
    if (err?.code === 'STORAGE_CONFIG_MISSING' || err?.message === 'STORAGE_CONFIG_MISSING') {
      res.status(500).json({
        success: false,
        error: 'STORAGE_CONFIG_MISSING',
        message: 'تنظیمات فضای ذخیره‌سازی ابری (BLOB_READ_WRITE_TOKEN) در متغیرهای سرور یافت نشد.',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'ROLLBACK_ERROR',
      message: 'خطا در بازگردانی نسخه گزارش.',
    });
  }
});
