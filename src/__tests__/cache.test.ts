import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService } from '../core/services/cacheService';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService({ maxEntries: 10, maxSizeBytes: 1024 * 1024 });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('basic operations', () => {
    it('stores and retrieves values', () => {
      cache.set('key1', { data: 'hello' });
      const result = cache.get<typeof cache extends CacheService ? unknown : never>('key1');
      expect(result).toEqual({ data: 'hello' });
    });

    it('returns undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('overwrites existing keys', () => {
      cache.set('key1', 'first');
      cache.set('key1', 'second');
      expect(cache.get('key1')).toBe('second');
    });

    it('deletes entries', () => {
      cache.set('key1', 'value');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('reports has correctly', () => {
      cache.set('key1', 'value');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('clears all entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      expect(cache.keys()).toHaveLength(0);
    });
  });

  describe('TTL', () => {
    it('expires entries after TTL', () => {
      cache.set('short', 'value', { ttlMs: 1 });
      expect(cache.has('short')).toBe(true);
      // Simulate time passing
      vi.useFakeTimers();
      vi.advanceTimersByTime(10);
      expect(cache.has('short')).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('categories', () => {
    it('stores entries with categories', () => {
      cache.set('a', 1, { category: 'history' });
      cache.set('b', 2, { category: 'history' });
      cache.set('c', 3, { category: 'theme' });
      expect(cache.keysByCategory('history')).toHaveLength(2);
      expect(cache.keysByCategory('theme')).toHaveLength(1);
    });

    it('clears by category', () => {
      cache.set('a', 1, { category: 'history' });
      cache.set('b', 2, { category: 'theme' });
      const cleared = cache.clearCategory('history');
      expect(cleared).toBe(1);
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
    });
  });

  describe('tags', () => {
    it('clears by tag', () => {
      cache.set('a', 1, { tags: ['important'] });
      cache.set('b', 2, { tags: ['temporary'] });
      const cleared = cache.clearByTag('important');
      expect(cleared).toBe(1);
    });
  });

  describe('getOrSet', () => {
    it('returns cached value if exists', () => {
      cache.set('key', 'cached');
      const result = cache.getOrSet('key', () => 'new');
      expect(result).toBe('cached');
    });

    it('calls factory and caches if missing', () => {
      const factory = vi.fn(() => 'computed');
      const result = cache.getOrSet('key', factory);
      expect(result).toBe('computed');
      expect(factory).toHaveBeenCalledOnce();
      expect(cache.get('key')).toBe('computed');
    });
  });

  describe('stats', () => {
    it('tracks hit and miss counts', () => {
      cache.set('a', 1);
      cache.get('a'); // hit
      cache.get('b'); // miss
      const stats = cache.getStats();
      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(1);
      expect(stats.totalEntries).toBe(1);
    });
  });

  describe('eviction', () => {
    it('evicts when max entries exceeded', () => {
      const smallCache = new CacheService({ maxEntries: 3 });
      smallCache.set('a', 1);
      smallCache.set('b', 2);
      smallCache.set('c', 3);
      smallCache.set('d', 4);
      expect(smallCache.keys().length).toBeLessThanOrEqual(3);
      smallCache.destroy();
    });
  });

  describe('invalidate', () => {
    it('invalidates entries matching pattern', () => {
      cache.set('user:1', 'alice');
      cache.set('user:2', 'bob');
      cache.set('theme:dark', 'dark');
      const count = cache.invalidate('^user:');
      expect(count).toBe(2);
      expect(cache.has('theme:dark')).toBe(true);
    });
  });
});
