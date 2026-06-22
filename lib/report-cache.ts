interface CachedDeepReport {
  html: string;
  createdAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheGlobal = typeof globalThis & {
  __deepReportCache?: Map<string, CachedDeepReport>;
};

function getStore(): Map<string, CachedDeepReport> {
  const g = globalThis as CacheGlobal;
  if (!g.__deepReportCache) {
    g.__deepReportCache = new Map();
  }
  return g.__deepReportCache;
}

export function cacheKeyForUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

export function getCachedReport(url: string): CachedDeepReport | null {
  const key = cacheKeyForUrl(url);
  const entry = getStore().get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    getStore().delete(key);
    return null;
  }
  return entry;
}

export function setCachedReport(url: string, html: string): void {
  getStore().set(cacheKeyForUrl(url), {
    html,
    createdAt: Date.now(),
  });
}
