import fs from 'fs';
import path from 'path';
import { put, list } from '@vercel/blob';
import type { PublishedReport, PublicationHistoryItem, ReportVersionSummary } from '../src/types/index.js';

// In-memory cache as an optimization (not authoritative persistence)
let cachedLatestReport: PublishedReport | null = null;
let cachedHistory: PublicationHistoryItem[] = [];

/**
 * Check if the current runtime is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if Vercel Blob storage is properly configured.
 * Valid Vercel Blob tokens start with 'vercel_blob_' (e.g. vercel_blob_rw_...).
 */
export function isVercelBlobConfigured(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  return trimmed.startsWith('vercel_blob_');
}

// -------------------------------------------------------------
// LOCAL FILESYSTEM HELPERS (STRICTLY FOR LOCAL DEV ONLY)
// Note: Never execute any of these at module import time!
// -------------------------------------------------------------
function getLocalDataDir(): string {
  return path.join(process.cwd(), '.data');
}

function ensureLocalDataDirLazy(): void {
  if (isProduction()) return; // Never run on serverless production
  try {
    const dir = getLocalDataDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Ignore filesystem errors
  }
}

function readLocalJsonFile<T>(filename: string): T | null {
  if (isProduction()) return null;
  try {
    const filePath = path.join(getLocalDataDir(), filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.warn(`[Storage:Dev] Could not read local file ${filename}:`, err);
  }
  return null;
}

function writeLocalJsonFile(filename: string, data: any): void {
  if (isProduction()) return;
  try {
    ensureLocalDataDirLazy();
    const filePath = path.join(getLocalDataDir(), filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn(`[Storage:Dev] Could not write local file ${filename}:`, err);
  }
}

// -------------------------------------------------------------
// VERCEL BLOB STORAGE READ/WRITE HELPERS
// -------------------------------------------------------------

/**
 * Read and parse JSON content from Vercel Blob by exact pathname
 */
async function readBlobJson<T>(pathname: string): Promise<T | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !token.startsWith('vercel_blob_')) return null;

  try {
    const { blobs } = await list({
      prefix: pathname,
      limit: 10,
      token,
    });

    const matchingBlob = blobs.find((b) => b.pathname === pathname);
    if (!matchingBlob) {
      return null;
    }

    const response = await fetch(matchingBlob.url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.warn(`[Storage:Blob] Failed to fetch ${pathname} from ${matchingBlob.url} (status: ${response.status})`);
      return null;
    }

    const data = (await response.json()) as T;
    return data;
  } catch (err: any) {
    // If access denied or invalid token, convert to controlled STORAGE_CONFIG_MISSING
    if (err?.name === 'BlobAccessError' || err?.message?.includes('Access denied') || err?.message?.includes('token')) {
      const customErr: any = new Error('STORAGE_CONFIG_MISSING');
      customErr.code = 'STORAGE_CONFIG_MISSING';
      throw customErr;
    }
    console.error(`[Storage:Blob] Error reading blob ${pathname}:`, err);
    throw err;
  }
}

// -------------------------------------------------------------
// PUBLIC STORAGE API
// -------------------------------------------------------------

/**
 * Get the latest officially published report
 * In production: strictly reads reports/latest.json from Vercel Blob.
 * If storage is empty: returns null (never throws or crashes).
 */
export async function getLatestPublishedReport(): Promise<PublishedReport | null> {
  // 1. Production or configured Vercel Blob environment
  if (isVercelBlobConfigured()) {
    try {
      const blobReport = await readBlobJson<PublishedReport>('reports/latest.json');
      if (blobReport) {
        cachedLatestReport = blobReport;
        return blobReport;
      }
      // No report published yet
      return null;
    } catch (err: any) {
      if (isProduction()) {
        throw err;
      }
      console.warn('[Storage:Dev] Blob read failed in dev, falling back to local:', err?.message);
    }
  }

  // 2. Production missing BLOB_READ_WRITE_TOKEN
  if (isProduction()) {
    const error: any = new Error('STORAGE_CONFIG_MISSING');
    error.code = 'STORAGE_CONFIG_MISSING';
    throw error;
  }

  // 3. Local development fallback
  if (cachedLatestReport) {
    return cachedLatestReport;
  }
  const localReport = readLocalJsonFile<PublishedReport>('latest.json');
  if (localReport) {
    cachedLatestReport = localReport;
    return localReport;
  }

  return null;
}

/**
 * Get latest report version info (lightweight for client polling)
 */
export async function getLatestReportVersionInfo(): Promise<ReportVersionSummary> {
  const latest = await getLatestPublishedReport();
  if (!latest) {
    return {
      success: true,
      hasReport: false,
      version: 0,
    };
  }

  return {
    success: true,
    hasReport: true,
    id: latest.id,
    reportDate: latest.reportDate,
    version: latest.version,
    publishedAt: latest.publishedAt,
    publishedBy: latest.publishedBy,
  };
}

/**
 * Retrieve full publication history
 */
export async function getPublicationHistory(): Promise<PublicationHistoryItem[]> {
  if (isVercelBlobConfigured()) {
    try {
      const history = await readBlobJson<PublicationHistoryItem[]>('reports/history.json');
      if (history && Array.isArray(history)) {
        cachedHistory = history;
        return history;
      }
      return [];
    } catch (err: any) {
      if (isProduction()) {
        throw err;
      }
      console.warn('[Storage:Dev] Blob history read failed in dev:', err?.message);
    }
  }

  if (isProduction()) {
    return [];
  }

  // Local development
  if (cachedHistory.length > 0) {
    return cachedHistory;
  }
  const localHistory = readLocalJsonFile<PublicationHistoryItem[]>('history.json');
  if (localHistory && Array.isArray(localHistory)) {
    cachedHistory = localHistory;
    return localHistory;
  }

  return [];
}

/**
 * Save an immutable report snapshot and update latest pointer & publication history
 */
export async function savePublishedReport(
  report: PublishedReport
): Promise<{ success: boolean; version: number; report: PublishedReport }> {
  const isBlob = isVercelBlobConfigured();
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (isProduction() && !isBlob) {
    const error: any = new Error('STORAGE_CONFIG_MISSING');
    error.code = 'STORAGE_CONFIG_MISSING';
    throw error;
  }

  // 1. Determine next version safely
  let currentHistory: PublicationHistoryItem[] = [];
  try {
    currentHistory = await getPublicationHistory();
  } catch {
    currentHistory = [];
  }

  let nextVersion = 1;
  if (currentHistory.length > 0) {
    const maxV = Math.max(...currentHistory.map((h) => h.version || 1));
    nextVersion = maxV + 1;
  } else if (cachedLatestReport?.version) {
    nextVersion = cachedLatestReport.version + 1;
  }

  const sanitizedDate = (report.reportDate || 'unknown').replace(/[\/\\]/g, '-');
  const projectId = report.projectId || report.project?.id || 'LOICO-500MW';
  const reportId = `rep-${sanitizedDate}-v${nextVersion}`;

  const finalizedReport: PublishedReport = {
    ...report,
    id: reportId,
    version: nextVersion,
    publishedAt: new Date().toISOString(),
  };

  const historyItem: PublicationHistoryItem = {
    id: reportId,
    projectId,
    reportDate: finalizedReport.reportDate,
    version: nextVersion,
    publishedAt: finalizedReport.publishedAt,
    publishedBy: finalizedReport.publishedBy || 'Admin',
    plannedProgress: finalizedReport.kpis?.plannedProgress ?? null,
    actualProgress: finalizedReport.kpis?.actualProgress ?? null,
    variance: finalizedReport.kpis?.progressVariance ?? null,
    totalManpower: finalizedReport.kpis?.siteManpower?.total ?? null,
    presentManpower: finalizedReport.kpis?.siteManpower?.present ?? null,
    absentManpower: finalizedReport.kpis?.siteManpower?.absent ?? null,
    attendanceRatio: finalizedReport.kpis?.siteManpower?.attendanceRatio ?? null,
    equipmentInstalled: finalizedReport.kpis?.equipmentInstalled ?? null,
    equipmentTotal: finalizedReport.kpis?.equipmentTotal ?? null,
    equipmentPercentage: finalizedReport.kpis?.equipmentInstallationPercentage ?? null,
    financialProgress: finalizedReport.kpis?.financialProgress ?? null,
    criticalIssuesCount: finalizedReport.daily?.keyIssues?.length ?? 0,
    keyActivitiesCount: finalizedReport.daily?.importantActivities?.length ?? 0,
    status: 'active',
  };

  const updatedHistory = [historyItem, ...currentHistory.map((h) => ({ ...h, status: 'archived' as const }))];
  const serializedReport = JSON.stringify(finalizedReport);
  const serializedHistory = JSON.stringify(updatedHistory);

  // 2. Persist to Vercel Blob if configured
  if (isBlob && token) {
    try {
      // 2a. Upload immutable snapshot to /snapshots/
      await put(`reports/snapshots/v${nextVersion}.json`, serializedReport, {
        access: 'public',
        contentType: 'application/json',
        token,
      });

      // 2b. Upload project-date specific snapshot
      await put(`reports/${projectId}/${sanitizedDate}/v${nextVersion}.json`, serializedReport, {
        access: 'public',
        contentType: 'application/json',
        token,
      });

      // 2c. Upload latest pointer (authoritative latest)
      await put('reports/latest.json', serializedReport, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        token,
      });

      // 2d. Upload history
      await put('reports/history.json', serializedHistory, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        token,
      });

      console.log(`[Storage:Blob] Successfully published report v${nextVersion} to Vercel Blob`);
    } catch (blobErr: any) {
      console.error('[Storage:Blob] Fatal error saving to Vercel Blob:', blobErr);
      if (isProduction()) {
        throw blobErr;
      }
    }
  }

  // 3. Persist to local filesystem only in local dev
  if (!isProduction()) {
    writeLocalJsonFile('latest.json', finalizedReport);
    writeLocalJsonFile('history.json', updatedHistory);
    writeLocalJsonFile(`${reportId}.json`, finalizedReport);
  }

  // 4. Update memory cache
  cachedLatestReport = finalizedReport;
  cachedHistory = updatedHistory;

  return {
    success: true,
    version: nextVersion,
    report: finalizedReport,
  };
}

/**
 * Roll back to a previous version
 */
export async function rollbackToVersion(version: number): Promise<PublishedReport | null> {
  const isBlob = isVercelBlobConfigured();
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (isBlob && token) {
    try {
      // 1. Try reading direct snapshot
      let targetReport = await readBlobJson<PublishedReport>(`reports/snapshots/v${version}.json`);

      // 2. If not found, search reports/ prefix for version
      if (!targetReport) {
        const { blobs } = await list({ prefix: 'reports/', token });
        const match = blobs.find((b) => b.pathname.endsWith(`v${version}.json`));
        if (match) {
          const res = await fetch(match.url, {
            headers: { 'Cache-Control': 'no-cache, no-store' },
          });
          if (res.ok) {
            targetReport = (await res.json()) as PublishedReport;
          }
        }
      }

      if (targetReport) {
        // Re-publish as latest.json in Vercel Blob
        await put('reports/latest.json', JSON.stringify(targetReport), {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false,
          token,
        });

        cachedLatestReport = targetReport;
        return targetReport;
      }
    } catch (err: any) {
      console.error(`[Storage:Blob] Error during rollback to v${version}:`, err);
      if (isProduction()) throw err;
    }
  }

  // Local dev rollback
  if (!isProduction()) {
    const dir = getLocalDataDir();
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const match = files.find((f) => f.endsWith(`-v${version}.json`));
        if (match) {
          const data = fs.readFileSync(path.join(dir, match), 'utf8');
          const parsed: PublishedReport = JSON.parse(data);
          writeLocalJsonFile('latest.json', parsed);
          cachedLatestReport = parsed;
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[Storage:Dev] Rollback error:', err);
    }
  }

  return null;
}
