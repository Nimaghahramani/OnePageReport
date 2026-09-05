import { Router, Request, Response } from 'express';
import {
  verifyAdminPassword,
  createAdminSessionToken,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  extractTokenFromRequest,
  verifyAdminSessionToken,
  requireAdminAuth,
} from './auth';
import {
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
 * Health check endpoint
 */
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/report/latest
 * Public access: returns the latest officially published report
 */
apiRouter.get('/report/latest', async (_req: Request, res: Response) => {
  setNoCacheHeaders(res);
  try {
    const report = await getLatestPublishedReport();
    if (!report) {
      res.json({
        success: true,
        data: null,
        message: 'NO_PUBLISHED_REPORT',
      });
      return;
    }
    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    console.error('[API] /report/latest error:', err);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'خطا در دریافت آخرین گزارش از سرور.',
    });
  }
});

// Alias for plural /reports/latest
apiRouter.get('/reports/latest', async (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  try {
    const report = await getLatestPublishedReport();
    if (!report) {
      res.json({
        success: true,
        data: null,
        message: 'NO_PUBLISHED_REPORT',
      });
      return;
    }
    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
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
 * Public access: lightweight version check for client auto-updating every 5 minutes
 */
apiRouter.get('/report/version', async (_req: Request, res: Response) => {
  setNoCacheHeaders(res);
  try {
    const versionInfo = await getLatestReportVersionInfo();
    res.json(versionInfo);
  } catch (err: any) {
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
 * Verify password against server-side ADMIN_PASSWORD and set HttpOnly session cookie
 */
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    res.status(400).json({
      success: false,
      error: 'MISSING_PASSWORD',
      message: 'لطفاً رمز عبور را وارد نمایید.',
    });
    return;
  }

  const isValid = verifyAdminPassword(password);
  if (!isValid) {
    // Add artificial delay to prevent brute-force timing
    setTimeout(() => {
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'رمز عبور مدیریت نادرست است.',
      });
    }, 400);
    return;
  }

  const token = createAdminSessionToken();
  setAdminSessionCookie(res, token);

  res.json({
    success: true,
    message: 'ورود به پنل مدیریت با موفقیت انجام شد.',
    user: {
      role: 'admin',
      name: 'مدیر ارشد پروژه',
    },
  });
});

/**
 * POST /api/admin/logout
 * Clears HttpOnly session cookie
 */
apiRouter.post('/admin/logout', (_req: Request, res: Response) => {
  clearAdminSessionCookie(res);
  res.json({
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
    res.json({
      success: true,
      authenticated: false,
    });
    return;
  }

  res.json({
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
  res.json({
    success: true,
    ...result,
  });
});

/**
 * POST /api/admin/publish
 * Server-side publication workflow:
 * 1. Verify admin session (handled by middleware)
 * 2. Validate normalized draft report
 * 3. Assign next version
 * 4. Save immutable snapshot in central storage
 * 5. Update latest-report pointer and history
 * 6. Return success
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

    res.json({
      success: true,
      message: `گزارش نسخه ${saveResult.version} با موفقیت منتشر گردید.`,
      version: saveResult.version,
      id: saveResult.report.id,
      publishedAt: saveResult.report.publishedAt,
      report: saveResult.report,
    });
  } catch (err: any) {
    console.error('[API] /admin/publish error:', err);
    res.status(500).json({
      success: false,
      error: 'PUBLISH_STORAGE_ERROR',
      message: 'خطا در ذخیره‌سازی نسخه نهایی گزارش در سرور.',
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
    res.json({
      success: true,
      history,
    });
  } catch (err: any) {
    console.error('[API] /admin/history error:', err);
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

    res.json({
      success: true,
      message: `گزارش با موفقیت به نسخه ${version} بازگردانی شد.`,
      report: restored,
    });
  } catch (err: any) {
    console.error('[API] /admin/rollback error:', err);
    res.status(500).json({
      success: false,
      error: 'ROLLBACK_ERROR',
      message: 'خطا در بازگردانی نسخه گزارش.',
    });
  }
});
