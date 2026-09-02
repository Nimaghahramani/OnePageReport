import {
  PublishedReport,
  PublicationHistoryItem,
  ApiResponse,
  AdminAuthResponse
} from '../types';

const ADMIN_TOKEN_KEY = 'loico_admin_session_token';

/**
 * Gets stored admin auth token from session/local storage
 */
export function getStoredAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Saves admin auth token
 */
export function setStoredAdminToken(token: string, remember = false): void {
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    if (remember) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    }
  } catch {
    // Ignore storage issues
  }
}

/**
 * Clears stored admin auth token
 */
export function clearStoredAdminToken(): void {
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Helper to build auth headers
 */
function getAuthHeaders(): HeadersInit {
  const token = getStoredAdminToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetch latest published report snapshot from server.
 * Returns { success: false } if fetch fails or no report has been published yet.
 * NEVER falls back to sample data.
 */
export async function fetchLatestPublishedReport(): Promise<ApiResponse<PublishedReport>> {
  try {
    const res = await fetch('/api/report/latest', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (res.status === 404) {
      const errorJson = await res.json().catch(() => null);
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: errorJson?.error?.message || 'گزارش منتشرشده‌ای در دسترس نیست.'
        }
      };
    }

    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      return {
        success: false,
        error: {
          code: errorJson?.error?.code || 'FETCH_ERROR',
          message: errorJson?.error?.message || 'دریافت آخرین گزارش با خطا مواجه شد.'
        }
      };
    }

    const data: ApiResponse<PublishedReport> = await res.json();
    return data;
  } catch (err: any) {
    console.error('API fetchLatestPublishedReport network error:', err);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'دریافت آخرین گزارش با خطا مواجه شد.'
      }
    };
  }
}

/**
 * Fetch a specific published report by ID from server cloud archive
 */
export async function fetchPublishedReportById(id: string): Promise<ApiResponse<PublishedReport>> {
  try {
    const res = await fetch(`/api/report/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return {
        success: false,
        error: {
          code: errData?.error?.code || 'FETCH_ERROR',
          message: errData?.error?.message || 'خطا در بازیابی نسخه گزارش از بایگانی'
        }
      };
    }

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: err.message || 'خطا در دریافت گزارش از بایگانی'
      }
    };
  }
}

/**
 * Fetch publication history list from server (Admin only)
 */
export async function fetchPublicationHistory(): Promise<ApiResponse<PublicationHistoryItem[]>> {
  try {
    const res = await fetch('/api/admin/history', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return {
        success: false,
        error: {
          code: errData?.error?.code || 'FETCH_ERROR',
          message: errData?.error?.message || 'خطا در دریافت تاریخچه انتشارات'
        }
      };
    }

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: err.message || 'خطا در ارتباط با سرور جهت دریافت سوابق انتشارات'
      }
    };
  }
}

/**
 * Server-side report validation (Admin only)
 */
export async function validateReportOnServer(report: any): Promise<ApiResponse<{ valid: boolean; blockingErrors: string[]; warnings: string[]; errorsCount: number; warningsCount: number }>> {
  try {
    const res = await fetch('/api/admin/validate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ report })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return {
        success: false,
        error: {
          code: errData?.error?.code || 'VALIDATION_FAILED',
          message: errData?.error?.message || 'خطا در اعتبارسنجی سرور'
        }
      };
    }

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'خطا در ارتباط با سرویس اعتبارسنجی'
      }
    };
  }
}

/**
 * Publish a new official report snapshot (Admin only)
 */
export async function publishOfficialReport(
  report: PublishedReport,
  publishedBy?: string
): Promise<ApiResponse<{ report: PublishedReport; history: PublicationHistoryItem[] }>> {
  try {
    const res = await fetch('/api/admin/publish', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ report, publishedBy })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return {
        success: false,
        error: {
          code: errData?.error?.code || 'PUBLISH_FAILED',
          message: errData?.error?.message || `خطا در انتشار رسمی گزارش (کد ${res.status})`
        }
      };
    }

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'PUBLISH_FAILED',
        message: err.message || 'خطا در انتشار رسمی گزارش در سرور'
      }
    };
  }
}

/**
 * Admin Login Authentication (Strict Server-Side Authentication)
 * No client-side fallback passwords or tokens.
 */
export async function adminLogin(password: string): Promise<ApiResponse<AdminAuthResponse>> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    const data: ApiResponse<AdminAuthResponse> = await res.json();
    if (data.success && data.data?.token) {
      setStoredAdminToken(data.data.token, true);
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'خطا در برقراری ارتباط با سرور جهت احراز هویت مدیریت.'
      }
    };
  }
}

/**
 * Checks admin authentication status via server
 */
export async function checkAdminAuth(): Promise<boolean> {
  const token = getStoredAdminToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/admin/me', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.success && data.data?.authenticated);
    }
    // If token was rejected by server, clear stale token
    if (res.status === 401 || res.status === 403) {
      clearStoredAdminToken();
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Admin Logout
 */
export function adminLogout(): void {
  clearStoredAdminToken();
  fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
}
