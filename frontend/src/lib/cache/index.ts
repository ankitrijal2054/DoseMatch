export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

export class BrowserCache {
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_PREFIX = "dosematch_cache_";

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    if (typeof window === "undefined") return; // SSR safety

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      console.warn("[Cache] localStorage write failed:", error);
      // Graceful degradation: continue without cache
    }
  }

  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null; // SSR safety

    try {
      const item = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const age = Date.now() - entry.timestamp;

      if (age > entry.ttl) {
        // Expired - clean up
        localStorage.removeItem(this.CACHE_PREFIX + key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn("[Cache] localStorage read failed:", error);
      return null;
    }
  }

  clear(): void {
    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("[Cache] localStorage clear failed:", error);
    }
  }

  stats(): { size: number; keys: string[]; entries: number } {
    if (typeof window === "undefined") {
      return { size: 0, keys: [], entries: 0 };
    }

    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(this.CACHE_PREFIX))
      .map((k) => k.replace(this.CACHE_PREFIX, ""));

    return {
      size: keys.length,
      keys,
      entries: keys.length,
    };
  }
}

export const cache = new BrowserCache();
