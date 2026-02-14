interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const cache = new MemoryCache();

export const CacheTTL = {
  SHORT: 30 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 60 * 60 * 1000,
  TOKEN_MARGIN: 5 * 60 * 1000,
} as const;

export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await fn();
  cache.set(key, result, ttlMs);
  return result;
}


