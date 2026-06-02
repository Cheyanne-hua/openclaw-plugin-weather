import type { CacheEntry } from "./types.js";
import { CACHE_TTL_MS } from "./constants.js";

/**
 * Lightweight in-memory key-value cache with per-entry TTL.
 * No external dependencies required.
 */
export class MemoryCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly defaultTtlMs: number;

  constructor(defaultTtlMs = CACHE_TTL_MS) {
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.data;
  }

  set(key: string, data: T, ttlMs?: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /** Purge all expired entries — call periodically if long-lived */
  purgeExpired(): number {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        purged++;
      }
    }
    return purged;
  }

  get size(): number {
    return this.store.size;
  }
}
