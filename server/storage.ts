import fs from 'fs';
import path from 'path';
import { put, list, get } from '@vercel/blob';
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
 * Also supports Vercel OIDC + BLOB_STORE_ID.
 */
export function isVercelBlobConfigured(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token && typeof token === 'string') {
    const trimmed = token.trim();
    if (trimmed.startsWith('vercel_blob_')) {
      return true;
    }
  }
  const storeId = process.env.BLOB_STORE_ID;
  const oidcToken = process.env.VERCEL_OIDC_TOKEN;
  if (storeId && typeof storeId === 'string' && storeId.trim().length > 0) {
    if ((oidcToken && oidcToken.trim().length > 0) || process.env.VERCEL) {
      return true;
    }
  }
  return false;
}

/**
 * Helper to resolve credentials for Vercel Blob operations.
 * Remains strictly server-side.
 */
function getBlobAuthOptions(): { token?: string; oidcToken?: string; storeId?: string } {
  const options: { token?: string; oidcToken?: string; storeId?: string } = {};
  const rwToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (rwToken) {
    options.token = rwToken;
  } else {
    const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
    const storeId = process.env.BLOB_STORE_ID?.trim();
    if (oidcToken) {
      options.oidcToken = oidcToken;
    }
    if (storeId) {
      options.storeId = storeId;
    }
  }
  return options;
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
// VERCEL BLOB STORAGE READ/WRITE HELPERS (PRIVATE STORE COMPATIBLE)
// -------------------------------------------------------------

/**
 * Read and parse JSON content from Vercel Blob by exact pathname using private access.
 * Performs authenticated read via @vercel/blob SDK (never unauthenticated fetch).
 */
async function readBlobJson<T>(pathname: string): Promise<T | null> {
  if (!isVercelBlobConfigured()) return null;
  const authOptions = getBlobAuthOptions();

  try {
    // 1. Attempt direct authenticated get via SDK
    const res = await get(pathname, {
      access: 'private',
      useCache: false,
      ...authOptions,
    });

    if (res && res.statusCode === 200 && res.stream) {
      const text = await new Response(res.stream).text();
      return JSON.parse(text) as T;
    }

    if (res === null) {
      // 2. Direct path returned 404; attempt fallback prefix search
      const { blobs } = await list({
        prefix: pathname,
        limit: 10,
        ...authOptions,
      });

      const matchingBlob = blobs.find((b) => b.pathname === pathname);
      if (!matchingBlob) {
        return null;
      }

      // Authenticated read via SDK get using matching blob URL with private access
      const blobRes = await get(matchingBlob.url, {
        access: 'private',
        useCache: false,
        ...authOptions,
      });

      if (blobRes && blobRes.statusCode === 200 && blobRes.stream) {
        const text = await new Response(blobRes.stream).text();
        return JSON.parse(text) as T;
      }
    }

    return null;
  } catch (err: any) {
    if (err?.name === 'BlobNotFoundError' || err?.message?.includes('404') || err?.status === 404) {
      return null;
    }
    // If access denied or invalid credentials, convert to controlled error
    if (
      err?.name === 'BlobAccessError' ||
      err?.name === 'BlobStoreNotFoundError' ||
      err?.message?.includes('Access denied') ||
      err?.message?.includes('token') ||
      err?.message?.includes('credentials')
    ) {
      const customErr: any = new Error('STORAGE_CONFIG_MISSING');
      customErr.code = 'STORAGE_CONFIG_MISSING';
      throw customErr;
    }
    console.error(`[Storage:Blob] Error reading private blob ${pathname}:`, err?.message || err);
    throw err;
  }
}

// -------------------------------------------------------------
// PUBLIC STORAGE API
// -------------------------------------------------------------

/**
 * Retrieve an immutable report snapshot by version number
 */
export async function getSnapshotByVersion(version: number): Promise<PublishedReport | null> {
  if (isVercelBlobConfigured()) {
    try {
      const snapshot = await readBlobJson<PublishedReport>(`reports/snapshots/v${version}.json`);
      if (snapshot) return snapshot;

      // Fallback search across reports prefix
      const authOptions = getBlobAuthOptions();
      const { blobs } = await list({ prefix: 'reports/', ...authOptions });
      const match = blobs.find((b) => b.pathname.endsWith(`v${version}.json`));
      if (match) {
        const res = await get(match.url, {
          access: 'private',
          useCache: false,
          ...authOptions,
        });
        if (res && res.statusCode === 200 && res.stream) {
          const text = await new Response(res.stream).text();
          return JSON.parse(text) as PublishedReport;
        }
      }
      return null;
    } catch (err: any) {
      if (isProduction()) throw err;
    }
  }

  // Local filesystem fallback
  if (!isProduction()) {
    const dir = getLocalDataDir();
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const match = files.find((f) => f.endsWith(`-v${version}.json`));
        if (match) {
          const data = fs.readFileSync(path.join(dir, match), 'utf8');
          return JSON.parse(data) as PublishedReport;
        }
      }
    } catch {
      // Local snapshot fallback
    }
  }

  return null;
}

/**
 * Get the latest officially published report
 * In production: strictly reads reports/latest.json from private Vercel Blob.
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

  // 2. Persist to Vercel Blob if configured (using private access)
  if (isBlob) {
    const authOptions = getBlobAuthOptions();
    try {
      // 2a. Upload immutable snapshot to /snapshots/ (private access)
      await put(`reports/snapshots/v${nextVersion}.json`, serializedReport, {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        ...authOptions,
      });

      // 2b. Upload project-date specific immutable snapshot (private access)
      await put(`reports/${projectId}/${sanitizedDate}/v${nextVersion}.json`, serializedReport, {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        ...authOptions,
      });

      // 2c. Upload latest pointer (authoritative latest) with allowOverwrite: true
      await put('reports/latest.json', serializedReport, {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        ...authOptions,
      });

      // 2d. Upload history with allowOverwrite: true
      await put('reports/history.json', serializedHistory, {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        ...authOptions,
      });

      console.log(`[Storage:Blob] Successfully published report v${nextVersion} to private Vercel Blob`);
    } catch (blobErr: any) {
      console.error('[Storage:Blob] Fatal error saving to Vercel Blob:', blobErr?.message || blobErr);
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

  // 4. Update memory cache ONLY after successful persistence
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
  const authOptions = getBlobAuthOptions();

  if (isBlob) {
    try {
      // 1. Retrieve the target snapshot safely via getSnapshotByVersion
      const targetReport = await getSnapshotByVersion(version);

      if (targetReport) {
        // Re-publish as latest.json in Vercel Blob using private access and allowOverwrite: true
        await put('reports/latest.json', JSON.stringify(targetReport), {
          access: 'private',
          contentType: 'application/json',
          addRandomSuffix: false,
          allowOverwrite: true,
          ...authOptions,
        });

        // Update history status if history exists
        try {
          const currentHistory = await getPublicationHistory();
          if (currentHistory.length > 0) {
            const updatedHistory = currentHistory.map((h) => ({
              ...h,
              status: (h.version === version ? 'active' : 'archived') as 'active' | 'archived',
            }));
            await put('reports/history.json', JSON.stringify(updatedHistory), {
              access: 'private',
              contentType: 'application/json',
              addRandomSuffix: false,
              allowOverwrite: true,
              ...authOptions,
            });
            cachedHistory = updatedHistory;
          }
        } catch (hErr: any) {
          console.warn('[Storage:Blob] Could not update history during rollback:', hErr?.message || hErr);
        }

        cachedLatestReport = targetReport;
        return targetReport;
      }
    } catch (err: any) {
      console.error(`[Storage:Blob] Error during rollback to v${version}:`, err?.message || err);
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
    } catch (err: any) {
      console.warn('[Storage:Dev] Rollback error:', err?.message || err);
    }
  }

  return null;
}

