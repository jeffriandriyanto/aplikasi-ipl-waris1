/**
 * Simple in-memory TTL cache for Nuxt server.
 * Reduces Firestore reads by caching frequently-accessed data.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<any>>()

/**
 * Get cached data or fetch from source.
 * @param key - Cache key
 * @param ttlMs - Time-to-live in milliseconds
 * @param fetcher - Async function to fetch data if cache miss
 */
export async function cachedFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now()
  const cached = store.get(key)

  if (cached && cached.expiresAt > now) {
    return cached.data as T
  }

  // Cache miss or expired — fetch fresh data
  const data = await fetcher()
  store.set(key, { data, expiresAt: now + ttlMs })
  return data
}

/**
 * Invalidate a specific cache key.
 */
export function invalidateCache(key: string): void {
  store.delete(key)
}

/**
 * Invalidate all cache keys matching a prefix.
 * e.g. invalidateCachePrefix('ipl:') clears all IPL period caches.
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key)
    }
  }
}

// Cache key constants
export const CACHE_KEYS = {
  CONFIG: 'config:site',
  HOUSES: 'houses:all',
  iplRecords: (period: string) => `ipl:${period}`,
  kasEntries: (period: string) => `kas:${period}`,
} as const

// TTL constants (in milliseconds)
export const CACHE_TTL = {
  CONFIG: 10 * 60 * 1000,    // 10 minutes
  HOUSES: 10 * 60 * 1000,    // 10 minutes
  IPL_RECORDS: 5 * 60 * 1000, // 5 minutes
  KAS_ENTRIES: 5 * 60 * 1000, // 5 minutes
} as const
