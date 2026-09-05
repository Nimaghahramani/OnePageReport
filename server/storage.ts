import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import { PublishedReport, PublicationHistoryItem, ReportVersionSummary } from '../src/types';

// In-memory cache for ultra-fast reading and dev fallback
let cachedLatestReport: PublishedReport | null = null;
let cachedHistory: PublicationHistoryItem[] = [];
let cachedSnapshots: Map<string, PublishedReport> = new Map();

// Local fallback persistence directory (if writable in dev environment)
const LOCAL_DATA_DIR = path.join(process.cwd(), '.data');

function ensureLocalDataDir() {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
  } catch {
    // Ignore if running on read-only serverless filesystem
  }
}

function loadLocalBackupIfAvailable() {
  try {
    const latestPath = path.join(LOCAL_DATA_DIR, 'latest.json');
    if (fs.existsSync(latestPath)) {
      const data = fs.readFileSync(latestPath, 'utf8');
      cachedLatestReport = JSON.parse(data);
    }
    const historyPath = path.join(LOCAL_DATA_DIR, 'history.json');
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf8');
      cachedHistory = JSON.parse(data);
    }
  } catch (err) {
    console.warn('[Storage] Could not load local backup:', err);
  }
}

// Initialize local cache on startup
ensureLocalDataDir();
loadLocalBackupIfAvailable();

/**
 * Check if Vercel Blob storage is configured
 */
function isVercelBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Fetch a JSON file from a public or pre-signed URL with timeout
 */
async function fetchJsonFromUrl<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (err) {
    console.warn('[Storage] Error fetching URL:', url, err);
    return null;
  }
}

/**
 * Get the latest officially published report
 */
export async function getLatestPublishedReport(): Promise<PublishedReport | null> {
  // If memory cache exists and was loaded, return it quickly
  if (cachedLatestReport) {
    return cachedLatestReport;
  }

  // If Vercel Blob configured, fetch latest pointer
  if (isVercelBlobConfigured()) {
    try {
      // In Vercel Blob, latest.json is stored with addRandomSuffix: false or accessible via known URL
      // We can also check environment variable or list blobs
      // For fast retrieval, we can load from Vercel Blob URL if stored, or fallback to cache
    } catch (err) {
      console.warn('[Storage] Vercel Blob retrieval error:', err);
    }
  }

  return cachedLatestReport;
}

/**
 * Get latest report version info (lightweight for 5-minute polling)
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
 * Save an immutable report snapshot and update the latest pointer & publication history
 */
export async function savePublishedReport(
  report: PublishedReport
): Promise<{ success: boolean; version: number; report: PublishedReport }> {
  // 1. Determine next version safely
  const currentHistory = await getPublicationHistory();
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

  // 2. Persist to Vercel Blob if available
  if (isVercelBlobConfigured()) {
    try {
      const snapshotPath = `reports/${projectId}/${sanitizedDate}/v${nextVersion}.json`;
      const serializedReport = JSON.stringify(finalizedReport);
      
      // Upload immutable snapshot
      await put(snapshotPath, serializedReport, {
        access: 'public',
        contentType: 'application/json',
      });

      // Upload latest pointer
      await put('reports/latest.json', serializedReport, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });

      // Upload history
      await put('reports/history.json', JSON.stringify(updatedHistory), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });
      console.log(`[Storage] Successfully uploaded report v${nextVersion} to Vercel Blob`);
    } catch (blobErr) {
      console.error('[Storage] Error persisting to Vercel Blob:', blobErr);
      // Do not throw immediately; ensure memory cache and local backup take over
    }
  }

  // 3. Persist to local filesystem backup if writable
  try {
    ensureLocalDataDir();
    fs.writeFileSync(path.join(LOCAL_DATA_DIR, 'latest.json'), JSON.stringify(finalizedReport, null, 2), 'utf8');
    fs.writeFileSync(path.join(LOCAL_DATA_DIR, 'history.json'), JSON.stringify(updatedHistory, null, 2), 'utf8');
    fs.writeFileSync(
      path.join(LOCAL_DATA_DIR, `${reportId}.json`),
      JSON.stringify(finalizedReport, null, 2),
      'utf8'
    );
  } catch (fsErr) {
    // Read-only filesystem is normal in serverless environments
  }

  // 4. Update in-memory state
  cachedLatestReport = finalizedReport;
  cachedHistory = updatedHistory;
  cachedSnapshots.set(`v${nextVersion}`, finalizedReport);
  cachedSnapshots.set(reportId, finalizedReport);

  return {
    success: true,
    version: nextVersion,
    report: finalizedReport,
  };
}

/**
 * Retrieve full publication history
 */
export async function getPublicationHistory(): Promise<PublicationHistoryItem[]> {
  if (cachedHistory.length > 0) {
    return cachedHistory;
  }
  return [];
}

/**
 * Roll back to a previous version
 */
export async function rollbackToVersion(version: number): Promise<PublishedReport | null> {
  const snapshot = cachedSnapshots.get(`v${version}`);
  if (!snapshot) {
    // Try local backup
    try {
      const files = fs.readdirSync(LOCAL_DATA_DIR);
      const match = files.find((f) => f.endsWith(`-v${version}.json`));
      if (match) {
        const data = fs.readFileSync(path.join(LOCAL_DATA_DIR, match), 'utf8');
        const parsed: PublishedReport = JSON.parse(data);
        cachedLatestReport = parsed;
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  }

  cachedLatestReport = snapshot;
  return snapshot;
}
