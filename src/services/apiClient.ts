import { PublishedReport, ReportVersionSummary, PublicationHistoryItem } from '../types';

export class ApiClient {
  private baseUrl = '/api';

  /**
   * Fetch the latest officially published report (Public)
   */
  async getLatestReport(): Promise<PublishedReport | null> {
    try {
      const response = await fetch(`${this.baseUrl}/report/latest`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        return data.data as PublishedReport;
      }
      return null;
    } catch (err) {
      console.error('[ApiClient] getLatestReport error:', err);
      throw err;
    }
  }

  /**
   * Check latest version metadata for lightweight 5-min polling (Public)
   */
  async getReportVersion(): Promise<ReportVersionSummary> {
    try {
      const response = await fetch(`${this.baseUrl}/report/version`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('[ApiClient] getReportVersion error:', err);
      return { success: false, hasReport: false };
    }
  }

  /**
   * Check if current session is authenticated as Admin
   */
  async checkAdminAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/me`, {
        cache: 'no-store',
        credentials: 'include'
      });
      if (!response.ok) return false;
      const data = await response.json();
      return Boolean(data.authenticated);
    } catch {
      return false;
    }
  }

  /**
   * Login with Admin password
   */
  async login(password: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'خطا در برقراری ارتباط با سرور.'
      };
    }
  }

  /**
   * Logout from Admin session
   */
  async logout(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  /**
   * Validate a draft report before publishing
   */
  async validateDraft(report: Partial<PublishedReport>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/admin/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(report)
    });
    return await response.json();
  }

  /**
   * Publish an official report (Admin only)
   */
  async publishReport(report: Partial<PublishedReport>): Promise<{
    success: boolean;
    version?: number;
    id?: string;
    publishedAt?: string;
    report?: PublishedReport;
    error?: string;
    message?: string;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(report)
      });
      return await response.json();
    } catch (err: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'خطا در ارسال گزارش به سرور.'
      };
    }
  }

  /**
   * Retrieve publication history (Admin only)
   */
  async getPublicationHistory(): Promise<PublicationHistoryItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/history`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.history)) {
        return data.history;
      }
      return [];
    } catch (err) {
      console.error('[ApiClient] getPublicationHistory error:', err);
      return [];
    }
  }

  /**
   * Roll back latest pointer to an archived version
   */
  async rollback(version: number): Promise<{ success: boolean; message?: string; report?: PublishedReport }> {
    const response = await fetch(`${this.baseUrl}/admin/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ version })
    });
    return await response.json();
  }
}

export const apiClient = new ApiClient();
