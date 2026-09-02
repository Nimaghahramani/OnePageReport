import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { serverReportStorage } from './src/server/storage';
import { requireAdminAuth, verifyAdminPassword, generateAdminSessionToken, isPasswordConfigured } from './src/server/auth';
import { validatePublishedReportPayload } from './src/server/validation';
import { ApiResponse, PublishedReport } from './src/types/publishedReport';

const app = express();
const PORT = 3000;

// Middleware for cookie parsing and JSON payload handling
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger for API calls
app.use('/api', (req, res, next) => {
  console.log(`[API ${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// 1. PUBLIC API ROUTES (Read-Only)
// ==========================================

/**
 * GET /api/report/latest
 * Returns the latest officially published snapshot from cloud storage.
 * If no report has been published, returns 404 NOT_FOUND.
 */
app.get('/api/report/latest', async (req, res) => {
  try {
    // Prevent stale caching across all CDNs and browsers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const latest = await serverReportStorage.getLatestPublishedReport();
    if (!latest) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'گزارش منتشرشده‌ای در دسترس نیست.'
        }
      } as ApiResponse);
    }

    return res.json({
      success: true,
      data: latest
    } as ApiResponse<PublishedReport>);
  } catch (err: any) {
    console.error('Error fetching latest report:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'خطا در دریافت آخرین گزارش از سرور.'
      }
    } as ApiResponse);
  }
});

/**
 * GET /api/report/:id
 * Returns a specific immutable published snapshot by ID from cloud archive.
 */
app.get('/api/report/:id', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    const reportId = req.params.id;
    const report = await serverReportStorage.getReportById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `گزارش با شناسه ${reportId} یافت نشد.`
        }
      } as ApiResponse);
    }

    return res.json({
      success: true,
      data: report
    } as ApiResponse<PublishedReport>);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'خطا در بازیابی نسخه گزارش از بایگانی.'
      }
    } as ApiResponse);
  }
});

// ==========================================
// 2. ADMIN AUTHENTICATION ROUTES
// ==========================================

/**
 * POST /api/admin/login
 * Validates admin credentials against environment variables and issues signed session.
 */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PASSWORD',
        message: 'لطفاً کلمه عبور مدیریت را وارد کنید.'
      }
    } as ApiResponse);
  }

  // Check if admin password is configured on the server
  if (!isPasswordConfigured()) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'AUTH_NOT_CONFIGURED',
        message: 'رمز عبور مدیریت در متغیرهای محیطی سرور (ADMIN_PASSWORD) تنظیم نشده است.'
      }
    } as ApiResponse);
  }

  const check = verifyAdminPassword(password);
  if (!check.success) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: check.message || 'کلمه عبور مدیریت نادرست است.'
      }
    } as ApiResponse);
  }

  // Generate cryptographically signed session token (Valid for 24 hours)
  const token = generateAdminSessionToken(86400);

  // Set secure HttpOnly session cookie
  res.cookie('loico_admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400 * 1000,
    path: '/'
  });

  return res.json({
    success: true,
    data: {
      authenticated: true,
      token,
      user: {
        username: 'admin',
        role: 'Administrator'
      }
    }
  });
});

/**
 * GET /api/admin/me
 * Verifies active session token validity.
 */
app.get('/api/admin/me', requireAdminAuth, (req, res) => {
  const adminUser = (req as any).adminUser;
  return res.json({
    success: true,
    data: {
      authenticated: true,
      user: {
        username: adminUser?.sub || 'admin',
        role: adminUser?.role || 'Administrator'
      }
    }
  });
});

/**
 * POST /api/admin/logout
 * Clears session cookie and invalidates client session.
 */
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('loico_admin_session', { path: '/' });
  return res.json({ success: true, data: { message: 'Logged out successfully' } });
});

// ==========================================
// 3. ADMIN WORKSPACE ROUTES (Protected)
// ==========================================

/**
 * GET /api/admin/history
 * Returns the official publication history list.
 */
app.get('/api/admin/history', requireAdminAuth, async (req, res) => {
  try {
    const history = await serverReportStorage.getPublicationHistory();
    return res.json({
      success: true,
      data: history
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'خطا در دریافت تاریخچه انتشارات.'
      }
    });
  }
});

/**
 * POST /api/admin/publish
 * Publishes a new official snapshot atomically to cloud storage.
 */
app.post('/api/admin/publish', requireAdminAuth, async (req, res) => {
  try {
    const { report, publishedBy } = req.body;
    if (!report || !report.reportDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'داده‌های پیش‌نویس گزارش ناقص یا فاقد تاریخ گزارش است.'
        }
      });
    }

    const publishResult = await serverReportStorage.publishReport(report, publishedBy);

    return res.json({
      success: true,
      data: {
        report: publishResult.report,
        history: publishResult.history,
        message: 'گزارش با موفقیت به‌صورت رسمی در فضای ابری منتشر شد.'
      }
    });
  } catch (err: any) {
    console.error('Publish error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PUBLISH_FAILED',
        message: err.message || 'خطا در ذخیره و انتشار گزارش در سرور.'
      }
    });
  }
});

/**
 * POST /api/admin/validate
 * Performs independent, comprehensive server-side data validation.
 */
app.post('/api/admin/validate', requireAdminAuth, (req, res) => {
  const { report } = req.body;
  if (!report) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_DATA', message: 'اطلاعات گزارش ارسال نشده است.' }
    });
  }

  const result = validatePublishedReportPayload(report);
  return res.json({
    success: true,
    data: result
  });
});

// ==========================================
// 4. VITE MIDDLEWARE & SERVER STARTUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LOICO Server] Executive Daily Report Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
