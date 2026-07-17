import { loggingSystem } from './loggingSystem';

export interface TempFile {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
  lastAccessed: Date;
  path: string;
  mimeType: string;
  checksum?: string;
  autoDelete: boolean;
  deleteAfterMs?: number;
  tags: string[];
}

export interface TempFileConfig {
  maxFiles: number;
  maxTotalSize: number;
  defaultTTL: number;
  cleanupOnExit: boolean;
  cleanupOnStartup: boolean;
  autoDeleteAfterAccess: boolean;
  secureDelete: boolean;
  storagePrefix: string;
}

export interface TempFileStats {
  totalFiles: number;
  totalSize: number;
  oldestFile: Date | null;
  newestFile: Date | null;
  avgAge: number;
  cleanupCount: number;
}

const DEFAULT_CONFIG: TempFileConfig = {
  maxFiles: 50,
  maxTotalSize: 100 * 1024 * 1024,
  defaultTTL: 30 * 60 * 1000,
  cleanupOnExit: true,
  cleanupOnStartup: true,
  autoDeleteAfterAccess: true,
  secureDelete: true,
  storagePrefix: 'cf-temp-'
};

export class TempFileManager {
  private files: Map<string, TempFile> = new Map();
  private config: TempFileConfig;
  private cleanupCount = 0;
  private cleanupTimers: Map<string, number> = new Map();
  private storage: Storage;

  constructor(config?: Partial<TempFileConfig>, storage?: Storage) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storage = storage || (typeof sessionStorage !== 'undefined' ? sessionStorage : this.createMemoryStorage());
    this.loadFromStorage();

    if (this.config.cleanupOnStartup) {
      this.cleanupExpired();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.config.cleanupOnExit) this.cleanupAll();
      });
    }
  }

  private createMemoryStorage(): Storage {
    const data = new Map<string, string>();
    return {
      get length() { return data.size; },
      key(index: number) { return [...data.keys()][index] || null; },
      getItem(key: string) { return data.get(key) || null; },
      setItem(key: string, value: string) { data.set(key, value); },
      removeItem(key: string) { data.delete(key); },
      clear() { data.clear(); }
    };
  }

  async createFile(name: string, content: string | ArrayBuffer, options?: {
    mimeType?: string;
    ttl?: number;
    tags?: string[];
    autoDelete?: boolean;
  }): Promise<TempFile> {
    const id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const size = typeof content === 'string' ? new Blob([content]).size : content.byteLength;
    const storageKey = `${this.config.storagePrefix}${id}`;

    if (typeof content === 'string') {
      this.storage.setItem(storageKey, content);
    } else {
      this.storage.setItem(storageKey, this.arrayBufferToBase64(content));
    }

    const file: TempFile = {
      id,
      name: this.sanitizeName(name),
      size,
      createdAt: new Date(),
      lastAccessed: new Date(),
      path: storageKey,
      mimeType: options?.mimeType || 'application/octet-stream',
      autoDelete: options?.autoDelete ?? this.config.autoDeleteAfterAccess,
      deleteAfterMs: options?.ttl ?? this.config.defaultTTL,
      tags: options?.tags || []
    };

    this.files.set(id, file);
    this.saveToStorage();
    this.enforceLimits();

    if (file.deleteAfterMs && file.deleteAfterMs > 0) {
      this.scheduleDelete(id, file.deleteAfterMs);
    }

    loggingSystem.debug('TempFileManager', `Created temp file: ${name} (${size} bytes)`, { id, size });
    return file;
  }

  async readFile(id: string): Promise<string | null> {
    const file = this.files.get(id);
    if (!file) return null;

    file.lastAccessed = new Date();
    const content = this.storage.getItem(file.path);
    if (!content) return null;

    if (file.autoDelete && file.deleteAfterMs) {
      this.scheduleDelete(id, file.deleteAfterMs);
    }

    this.saveToStorage();
    return content;
  }

  deleteFile(id: string): boolean {
    const file = this.files.get(id);
    if (!file) return false;

    const timer = this.cleanupTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(id);
    }

    if (this.config.secureDelete) {
      this.secureOverwrite(file.path);
    }
    this.storage.removeItem(file.path);
    this.files.delete(id);
    this.saveToStorage();

    loggingSystem.debug('TempFileManager', `Deleted temp file: ${file.name}`, { id });
    return true;
  }

  private secureOverwrite(key: string): void {
    const existing = this.storage.getItem(key);
    if (existing && existing.length > 0) {
      const garbage = 'x'.repeat(existing.length);
      this.storage.setItem(key, garbage);
      this.storage.setItem(key, '');
    }
  }

  fileExists(id: string): boolean {
    return this.files.has(id);
  }

  getFile(id: string): TempFile | undefined {
    return this.files.get(id);
  }

  getAllFiles(): TempFile[] {
    return Array.from(this.files.values());
  }

  getFilesByTag(tag: string): TempFile[] {
    return this.getAllFiles().filter(f => f.tags.includes(tag));
  }

  cleanupExpired(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [id, file] of this.files) {
      const age = now - file.createdAt.getTime();
      if (file.deleteAfterMs && age > file.deleteAfterMs) {
        this.deleteFile(id);
        cleaned++;
      }
    }

    this.cleanupCount += cleaned;
    if (cleaned > 0) {
      loggingSystem.info('TempFileManager', `Cleaned up ${cleaned} expired temp files`);
    }
    return cleaned;
  }

  cleanupAll(): number {
    let cleaned = 0;
    for (const [id] of this.files) {
      this.deleteFile(id);
      cleaned++;
    }
    this.cleanupCount += cleaned;
    loggingSystem.info('TempFileManager', `Cleaned up all ${cleaned} temp files`);
    return cleaned;
  }

  cleanupByTag(tag: string): number {
    let cleaned = 0;
    for (const [id, file] of this.files) {
      if (file.tags.includes(tag)) {
        this.deleteFile(id);
        cleaned++;
      }
    }
    this.cleanupCount += cleaned;
    return cleaned;
  }

  private scheduleDelete(id: string, delayMs: number): void {
    const existing = this.cleanupTimers.get(id);
    if (existing) clearTimeout(existing);
    const timer = window.setTimeout(() => this.deleteFile(id), delayMs);
    this.cleanupTimers.set(id, timer);
  }

  private enforceLimits(): void {
    const files = this.getAllFiles();
    if (files.length > this.config.maxFiles) {
      const sorted = files.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const toRemove = sorted.slice(0, files.length - this.config.maxFiles);
      toRemove.forEach(f => this.deleteFile(f.id));
    }

    let totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > this.config.maxTotalSize) {
      const sorted = files.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      for (const f of sorted) {
        if (totalSize <= this.config.maxTotalSize) break;
        totalSize -= f.size;
        this.deleteFile(f.id);
      }
    }
  }

  getStats(): TempFileStats {
    const files = this.getAllFiles();
    const now = Date.now();
    const ages = files.map(f => now - f.createdAt.getTime());
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    return {
      totalFiles: files.length,
      totalSize,
      oldestFile: files.length > 0 ? new Date(Math.min(...files.map(f => f.createdAt.getTime()))) : null,
      newestFile: files.length > 0 ? new Date(Math.max(...files.map(f => f.createdAt.getTime()))) : null,
      avgAge: ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0,
      cleanupCount: this.cleanupCount
    };
  }

  getConfig(): TempFileConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<TempFileConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return binary;
  }

  private saveToStorage(): void {
    try {
      const data = JSON.stringify(Array.from(this.files.entries()));
      this.storage.setItem(`${this.config.storagePrefix}index`, data);
    } catch {
      loggingSystem.warn('TempFileManager', 'Failed to save temp file index');
    }
  }

  private loadFromStorage(): void {
    try {
      const data = this.storage.getItem(`${this.config.storagePrefix}index`);
      if (data) {
        const entries = JSON.parse(data) as Array<[string, TempFile]>;
        for (const [id, file] of entries) {
          file.createdAt = new Date(file.createdAt);
          file.lastAccessed = new Date(file.lastAccessed);
          this.files.set(id, file);
        }
      }
    } catch {
      loggingSystem.warn('TempFileManager', 'Failed to load temp file index');
    }
  }

  destroy(): void {
    this.cleanupTimers.forEach(timer => clearTimeout(timer));
    this.cleanupTimers.clear();
    if (this.config.cleanupOnExit) {
      this.cleanupAll();
    }
  }
}

export const tempFileManager = new TempFileManager();
