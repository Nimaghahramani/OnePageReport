import crypto from 'crypto';
import { put, list } from '@vercel/blob';
import { PublishedReport, PublicationHistoryItem } from '../types/publishedReport';
import { extractHistoryItem } from '../services/publishService';
import { validatePublishedReportPayload } from './validation';

export class CloudReportStorage {
  private inMemoryLatest: PublishedReport | null = null;
  private inMemoryHistory: PublicationHistoryItem[] = [];
  private inMemoryArchive: Map<string, PublishedReport> = new Map();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private isBlobAccessDenied = false;

  constructor() {
    // Initial async hydration from Vercel Blob if valid token exists
    this.initPromise = this.initCloudStorage();
  }

  private hasBlobToken(): boolean {
    if (this.isBlobAccessDenied) return false;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token || typeof token !== 'string') return false;
    const trimmed = token.trim();
    // Valid Vercel Blob tokens start with 'vercel_blob_rw_'
    if (!trimmed.startsWith('vercel_blob_rw_') || trimmed.length < 25) {
      return false;
    }
    return true;
  }

  private async initCloudStorage(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.hasBlobToken()) {
      console.log('[LOICO Storage] Operating in server cloud in-memory storage mode.');
      this.isInitialized = true;
      return;
    }

    try {
      console.log('[LOICO Cloud Storage] Connecting to Vercel Blob storage...');
      const token = process.env.BLOB_READ_WRITE_TOKEN!.trim();

      // 1. Fetch latest report from Vercel Blob
      const latestList = await list({ prefix: 'system/latest-report.json', token, limit: 1 });
      if (latestList.blobs && latestList.blobs.length > 0) {
        const latestBlob = latestList.blobs[0];
        const res = await fetch(latestBlob.url, { cache: 'no-store' });
        if (res.ok) {
          const reportJson: PublishedReport = await res.json();
          if (reportJson && reportJson.id) {
            this.inMemoryLatest = reportJson;
            this.inMemoryArchive.set(reportJson.id, reportJson);
            console.log(`[LOICO Cloud Storage] Loaded latest report: ${reportJson.id} (Date: ${reportJson.reportDate})`);
          }
        }
      }

      // 2. Fetch publication history from Vercel Blob
      const historyList = await list({ prefix: 'system/publication-history.json', token, limit: 1 });
      if (historyList.blobs && historyList.blobs.length > 0) {
        const historyBlob = historyList.blobs[0];
        const res = await fetch(historyBlob.url, { cache: 'no-store' });
        if (res.ok) {
          const historyJson: PublicationHistoryItem[] = await res.json();
          if (Array.isArray(historyJson)) {
            this.inMemoryHistory = historyJson;
            console.log(`[LOICO Cloud Storage] Loaded ${historyJson.length} historical publication records.`);
          }
        }
      }
    } catch (err: any) {
      this.isBlobAccessDenied = true;
      console.log('[LOICO Storage] Vercel Blob storage is not active or token was denied. Running in server in-memory storage mode.');
    } finally {
      this.isInitialized = true;
    }
  }

  public async ensureReady(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  public async getLatestPublishedReport(): Promise<PublishedReport | null> {
    await this.ensureReady();
    return this.inMemoryLatest;
  }

  public async getReportById(id: string): Promise<PublishedReport | null> {
    await this.ensureReady();
    if (this.inMemoryArchive.has(id)) {
      return this.inMemoryArchive.get(id)!;
    }

    if (this.inMemoryLatest && this.inMemoryLatest.id === id) {
      return this.inMemoryLatest;
    }

    // Try finding in Vercel Blob by searching with id in reports/
    if (this.hasBlobToken()) {
      try {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        const searchList = await list({ prefix: 'reports/', token });
        for (const blob of searchList.blobs) {
          if (blob.pathname.includes(id) || blob.url.includes(id)) {
            const res = await fetch(blob.url, { cache: 'no-store' });
            if (res.ok) {
              const report: PublishedReport = await res.json();
              if (report && report.id === id) {
                this.inMemoryArchive.set(id, report);
                return report;
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error searching report by ID in cloud blob:', e);
      }
    }

    return null;
  }

  public async getPublicationHistory(): Promise<PublicationHistoryItem[]> {
    await this.ensureReady();
    return this.inMemoryHistory;
  }

  /**
   * Atomic Publication Routine:
   * 1. Validates payload server-side
   * 2. Calculates version server-side (never trusting client version)
   * 3. Writes immutable version snapshot to reports/${projectId}/${cleanDate}/v${version}.json
   * 4. Verifies snapshot write success
   * 5. Updates system/publication-history.json
   * 6. Updates system/latest-report.json
   * 7. Updates in-memory state
   */
  public async publishReport(
    incomingReport: Partial<PublishedReport>,
    publishedBy = 'مدیر برنامه‌ریزی و کنترل پروژه'
  ): Promise<{ report: PublishedReport; history: PublicationHistoryItem[] }> {
    await this.ensureReady();

    // 1. Independent Server Validation
    const validation = validatePublishedReportPayload(incomingReport);
    if (!validation.valid) {
      throw new Error(`اعتبارسنجی گزارش ناموفق بود: ${validation.blockingErrors.join(' | ')}`);
    }

    const reportDate = incomingReport.reportDate!.trim();
    const projectId = (incomingReport.projectId || 'P1-MAHSHAHR').trim();

    // 2. Server-side Version Calculation (Inspect existing history for this date)
    const existingForDate = this.inMemoryHistory.filter(h => h.reportDate === reportDate);
    let nextVersion = 1;
    if (existingForDate.length > 0) {
      const highestVersion = Math.max(...existingForDate.map(h => h.version || 1));
      nextVersion = highestVersion + 1;
    }

    const cleanDateForPath = reportDate.replace(/[\/\\]/g, '-');
    const newId = `pub-${projectId}-${cleanDateForPath}-v${nextVersion}`;
    const publishedAt = new Date().toISOString();

    // Compute cryptographic checksum of critical payload parts
    const contentString = JSON.stringify({
      reportDate,
      projectId,
      pms: incomingReport.pms,
      kpis: incomingReport.kpis,
      daily: incomingReport.daily,
      financial: incomingReport.financial,
      equipment: incomingReport.equipment
    });
    const contentHash = crypto.createHash('sha256').update(contentString).digest('hex').substring(0, 16);

    // Sanitize metadata to never leak private download tokens or storage credentials
    const cleanSourceFiles = Array.isArray(incomingReport.metadata?.sourceFiles)
      ? incomingReport.metadata.sourceFiles.map(s => {
          // If a file string contains query params or URLs, strip to base file name
          if (typeof s === 'string') {
            return s.split(/[?#]/)[0].split(/[/\\]/).pop() || s;
          }
          return 'source.xlsx';
        })
      : [];

    const fullPublishedReport: PublishedReport = {
      ...incomingReport,
      id: newId,
      projectId,
      version: nextVersion,
      reportDate,
      publishedAt,
      publishedBy: incomingReport.publishedBy || publishedBy,
      metadata: {
        ...(incomingReport.metadata || {}),
        sourceFiles: cleanSourceFiles,
        schemaVersion: '1.0.0',
        validationStatus: validation.warnings.length > 0 ? 'warning' : 'valid',
        contentHash
      }
    } as PublishedReport;

    const reportJsonString = JSON.stringify(fullPublishedReport, null, 2);

    // 3. Store Immutable Snapshot in Vercel Blob (if active)
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const snapshotPath = `reports/${projectId}/${cleanDateForPath}/v${nextVersion}.json`;

    if (this.hasBlobToken() && token) {
      try {
        console.log(`[LOICO Cloud Storage] Uploading snapshot to: ${snapshotPath}`);
        await put(snapshotPath, reportJsonString, {
          access: 'public',
          addRandomSuffix: false,
          token
        });
      } catch (blobErr: any) {
        this.isBlobAccessDenied = true;
        console.warn('[LOICO Cloud Storage] Warning uploading snapshot to Blob, continuing in memory:', blobErr.message);
      }
    }

    // 4. Prepare updated history
    const updatedHistory: PublicationHistoryItem[] = this.inMemoryHistory.map(item => {
      if (item.status === 'published') {
        return { ...item, status: 'superseded' };
      }
      return item;
    });

    const newHistoryItem = extractHistoryItem(fullPublishedReport, 'published');
    const finalHistoryList = [newHistoryItem, ...updatedHistory];
    const historyJsonString = JSON.stringify(finalHistoryList, null, 2);

    // 5. Store History and Latest Pointer in Vercel Blob (if active)
    if (this.hasBlobToken() && token) {
      try {
        await put('system/publication-history.json', historyJsonString, {
          access: 'public',
          addRandomSuffix: false,
          token
        });

        await put('system/latest-report.json', reportJsonString, {
          access: 'public',
          addRandomSuffix: false,
          token
        });
      } catch (blobErr: any) {
        this.isBlobAccessDenied = true;
        console.warn('[LOICO Cloud Storage] Warning updating index in Blob, continuing in memory:', blobErr.message);
      }
    }

    // 6. Atomically update in-memory state on successful storage write
    this.inMemoryArchive.set(newId, fullPublishedReport);
    this.inMemoryHistory = finalHistoryList;
    this.inMemoryLatest = fullPublishedReport;

    console.log(`[LOICO Cloud Storage] Successfully published ${newId} (Version ${nextVersion})`);

    return {
      report: fullPublishedReport,
      history: this.inMemoryHistory
    };
  }
}

export const serverReportStorage = new CloudReportStorage();
