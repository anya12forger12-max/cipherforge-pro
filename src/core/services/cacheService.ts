import { loggingSystem } from '../security/loggingSystem';

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  size: number;
  ttlMs?: number;
  category: string;
  tags: string[];
}

export interface CacheConfig {
  maxSizeBytes: number;
  maxEntries: number;
  defaultTtlMs: number;
  enableStats: boolean;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
}

export interface CacheStats {
  totalEntries: number;
  totalSizeBytes: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  entriesByCategory: Record<string, number>;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxSizeBytes: 10 * 1024 * 1024,
  maxEntries: 500,
  defaultTtlMs: 30 * 60 * 1000,
  enableStats: true,
  evictionPolicy: 'lru'
};

export class CacheService {
  private entries: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  set<T>(key: string, value: T, options?: {
    ttlMs?: number;
    category?: string;
    tags?: string[];
  }): void {
    const size = this.estimateSize(value);
    const existing = this.entries.get(key);
    if (existing) {
      this.entries.delete(key);
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: existing?.createdAt || new Date(),
      lastAccessed: new Date(),
      accessCount: existing?.accessCount || 0,
      size,
      ttlMs: options?.ttlMs ?? this.config.defaultTtlMs,
      category: options?.category || 'default',
      tags: options?.tags || []
    };

    this.entries.set(key, entry as CacheEntry);
    this.enforceLimits();

    if (this.config.enableStats && size > 1024) {
      loggingSystem.debug('CacheService', `Cached: ${key} (${this.formatSize(size)})`);
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      this.missCount++;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.entries.delete(key);
      this.missCount++;
      return undefined;
    }

    entry.lastAccessed = new Date();
    entry.accessCount++;
    this.hitCount++;
    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.entries.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
  }

  clearCategory(category: string): number {
    let cleared = 0;
    for (const [key, entry] of this.entries) {
      if (entry.category === category) {
        this.entries.delete(key);
        cleared++;
      }
    }
    return cleared;
  }

  clearByTag(tag: string): number {
    let cleared = 0;
    for (const [key, entry] of this.entries) {
      if (entry.tags.includes(tag)) {
        this.entries.delete(key);
        cleared++;
      }
    }
    return cleared;
  }

  getOrSet<T>(key: string, factory: () => T | Promise<T>, options?: {
    ttlMs?: number;
    category?: string;
    tags?: string[];
  }): T | Promise<T> {
    const existing = this.get<T>(key);
    if (existing !== undefined) return existing;

    const result = factory();
    if (result instanceof Promise) {
      return result.then(value => {
        this.set(key, value, options);
        return value;
      });
    }
    this.set(key, result, options);
    return result;
  }

  invalidate(pattern: string): number {
    const regex = new RegExp(pattern);
    let invalidated = 0;
    for (const key of this.entries.keys()) {
      if (regex.test(key)) {
        this.entries.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  }

  keys(): string[] {
    return Array.from(this.entries.keys());
  }

  keysByCategory(category: string): string[] {
    return Array.from(this.entries.entries())
      .filter(([, entry]) => entry.category === category)
      .map(([key]) => key);
  }

  entriesByTag(tag: string): CacheEntry[] {
    return Array.from(this.entries.values()).filter(e => e.tags.includes(tag));
  }

  getStats(): CacheStats {
    const allEntries = Array.from(this.entries.values());
    const categories: Record<string, number> = {};
    for (const e of allEntries) {
      categories[e.category] = (categories[e.category] || 0) + 1;
    }

    return {
      totalEntries: allEntries.length,
      totalSizeBytes: allEntries.reduce((sum, e) => sum + e.size, 0),
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount + this.missCount > 0 ? this.hitCount / (this.hitCount + this.missCount) : 0,
      evictionCount: this.evictionCount,
      entriesByCategory: categories,
      oldestEntry: allEntries.length > 0 ? new Date(Math.min(...allEntries.map(e => e.createdAt.getTime()))) : null,
      newestEntry: allEntries.length > 0 ? new Date(Math.max(...allEntries.map(e => e.createdAt.getTime()))) : null
    };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttlMs) return false;
    return Date.now() - entry.createdAt.getTime() > entry.ttlMs;
  }

  private enforceLimits(): void {
    while (this.entries.size > this.config.maxEntries) {
      this.evictOne();
    }

    let totalSize = 0;
    for (const entry of this.entries.values()) totalSize += entry.size;
    while (totalSize > this.config.maxSizeBytes && this.entries.size > 0) {
      const evicted = this.evictOne();
      if (evicted) totalSize -= evicted;
    }
  }

  private evictOne(): number {
    if (this.entries.size === 0) return 0;

    let targetKey = '';
    let targetSize = 0;

    if (this.config.evictionPolicy === 'lru') {
      let oldestAccess = Infinity;
      for (const [key, entry] of this.entries) {
        if (entry.lastAccessed.getTime() < oldestAccess) {
          oldestAccess = entry.lastAccessed.getTime();
          targetKey = key;
          targetSize = entry.size;
        }
      }
    } else if (this.config.evictionPolicy === 'lfu') {
      let leastFreq = Infinity;
      for (const [key, entry] of this.entries) {
        if (entry.accessCount < leastFreq) {
          leastFreq = entry.accessCount;
          targetKey = key;
          targetSize = entry.size;
        }
      }
    } else {
      const first = this.entries.keys().next().value;
      if (first) {
        targetKey = first;
        targetSize = this.entries.get(first)?.size || 0;
      }
    }

    if (targetKey) {
      this.entries.delete(targetKey);
      this.evictionCount++;
    }

    return targetSize;
  }

  private estimateSize(value: unknown): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 100;
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  destroy(): void {
    this.clear();
  }
}

export const cacheService = new CacheService();
