import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DeliberationResult } from '../deliberation/index.js';

// ── Types ──────────────────────────────────────────────────────────────

export interface CacheOptions {
  /** Maximum number of results to keep in memory. Oldest entry is evicted when full. Default: 100. */
  maxEntries?: number;
  /**
   * If set, the cache is loaded from this JSON file on startup and written
   * back after every new entry. Useful for surviving server restarts.
   */
  persistPath?: string;
}

export interface CacheKey {
  question: string;
  panelSize?: number;
  seed?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────

function normalise(key: CacheKey): string {
  return JSON.stringify({
    q: key.question.trim().toLowerCase(),
    n: key.panelSize ?? 5,
    s: key.seed ?? null,
  });
}

// ── DeliberationCache ──────────────────────────────────────────────────

/**
 * In-memory LRU cache for deliberation results with optional file persistence.
 *
 * Cache key is the normalised question + panelSize + seed, so identical
 * deliberations are served instantly without hitting the Anthropic API.
 *
 * @example
 * ```ts
 * const cache = new DeliberationCache({ persistPath: '.cache/deliberations.json' });
 * await cache.load();
 *
 * const cached = cache.get({ question, panelSize: 5 });
 * if (cached) return cached;
 *
 * const result = await deliberate(question, { panelSize: 5 });
 * cache.set({ question, panelSize: 5 }, result);
 * await cache.persist();
 * ```
 */
export class DeliberationCache {
  // Map preserves insertion order — oldest entries are at the front.
  private readonly entries = new Map<string, DeliberationResult>();
  private readonly maxEntries: number;
  private readonly persistPath: string | undefined;

  constructor(options: CacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 100;
    this.persistPath = options.persistPath;
  }

  /** Return the cached result for this key, or undefined if not present. */
  get(key: CacheKey): DeliberationResult | undefined {
    return this.entries.get(normalise(key));
  }

  /**
   * Store a result. If the cache is at capacity, the oldest entry is evicted
   * (insertion-order eviction — effectively LRU for sequential access patterns).
   */
  set(key: CacheKey, result: DeliberationResult): void {
    const k = normalise(key);
    // Evict oldest when full (only if this is a new key)
    if (this.entries.size >= this.maxEntries && !this.entries.has(k)) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(k, result);
  }

  /** Number of entries currently in the cache. */
  get size(): number {
    return this.entries.size;
  }

  /** Remove all entries. */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Load entries from the persist file.
   * Silently succeeds if the file doesn't exist yet.
   */
  async load(): Promise<void> {
    if (!this.persistPath) return;
    try {
      const raw = await readFile(this.persistPath, 'utf8');
      const rows = JSON.parse(raw) as Array<[string, DeliberationResult]>;
      // Keep only the most recent maxEntries entries
      for (const [k, v] of rows.slice(-this.maxEntries)) {
        this.entries.set(k, v);
      }
    } catch {
      // File doesn't exist yet or is corrupt — start fresh
    }
  }

  /**
   * Write the current entries to the persist file.
   * Creates parent directories if they don't exist.
   */
  async persist(): Promise<void> {
    if (!this.persistPath) return;
    const dir = dirname(this.persistPath);
    await mkdir(dir, { recursive: true });
    const rows = [...this.entries.entries()];
    await writeFile(this.persistPath, JSON.stringify(rows), 'utf8');
  }
}
