import { loggingSystem } from './loggingSystem';

export interface SensitiveBuffer {
  id: string;
  data: string;
  createdAt: Date;
  cleared: boolean;
  context: string;
}

export interface MemorySecurityConfig {
  autoClearEnabled: boolean;
  clearDelayMs: number;
  maxBufferLifetime: number;
  maxBuffers: number;
  logClearOperations: boolean;
  wipeOnExit: boolean;
}

export interface MemorySecurityStats {
  totalBuffers: number;
  activeBuffers: number;
  clearedBuffers: number;
  totalBytesCleared: number;
  lastClearTime: Date | null;
}

const DEFAULT_CONFIG: MemorySecurityConfig = {
  autoClearEnabled: true,
  clearDelayMs: 30000,
  maxBufferLifetime: 300000,
  maxBuffers: 50,
  logClearOperations: true,
  wipeOnExit: true
};

export class MemorySecurity {
  private buffers: Map<string, SensitiveBuffer> = new Map();
  private config: MemorySecurityConfig;
  private clearTimers: Map<string, number> = new Map();
  private totalBytesCleared = 0;
  private lastClearTime: Date | null = null;

  constructor(config?: Partial<MemorySecurityConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (typeof window !== 'undefined' && this.config.wipeOnExit) {
      window.addEventListener('beforeunload', () => this.clearAllBuffers());
    }
  }

  registerSensitiveData(data: string, context: string): string {
    const id = `buf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const buffer: SensitiveBuffer = {
      id,
      data,
      createdAt: new Date(),
      cleared: false,
      context
    };

    this.buffers.set(id, buffer);
    this.enforceBufferLimit();

    if (this.config.autoClearEnabled) {
      this.scheduleClear(id, this.config.clearDelayMs);
    }

    if (this.config.logClearOperations) {
      loggingSystem.debug('MemorySecurity', `Registered sensitive buffer: ${context}`, { id, size: data.length });
    }

    return id;
  }

  clearBuffer(id: string): boolean {
    const buffer = this.buffers.get(id);
    if (!buffer || buffer.cleared) return false;

    buffer.data = this.overwriteString(buffer.data);
    buffer.cleared = true;
    this.totalBytesCleared += buffer.data.length;
    this.lastClearTime = new Date();

    const timer = this.clearTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.clearTimers.delete(id);
    }

    if (this.config.logClearOperations) {
      loggingSystem.debug('MemorySecurity', `Cleared sensitive buffer: ${buffer.context}`, { id });
    }

    return true;
  }

  clearAllBuffers(): number {
    let cleared = 0;
    for (const [id, buffer] of this.buffers) {
      if (!buffer.cleared) {
        this.clearBuffer(id);
        cleared++;
      }
    }

    this.clearTimers.forEach(timer => clearTimeout(timer));
    this.clearTimers.clear();

    if (cleared > 0) {
      loggingSystem.info('MemorySecurity', `Cleared ${cleared} sensitive buffers`, { totalBytesCleared: this.totalBytesCleared });
    }

    return cleared;
  }

  clearByContext(contextPattern: string): number {
    let cleared = 0;
    const pattern = new RegExp(contextPattern, 'i');
    for (const [id, buffer] of this.buffers) {
      if (!buffer.cleared && pattern.test(buffer.context)) {
        this.clearBuffer(id);
        cleared++;
      }
    }
    return cleared;
  }

  getBuffer(id: string): SensitiveBuffer | undefined {
    const buffer = this.buffers.get(id);
    if (buffer && !buffer.cleared) return buffer;
    return undefined;
  }

  isBufferActive(id: string): boolean {
    const buffer = this.buffers.get(id);
    return buffer !== undefined && !buffer.cleared;
  }

  private scheduleClear(id: string, delayMs: number): void {
    const timer = window.setTimeout(() => this.clearBuffer(id), delayMs);
    this.clearTimers.set(id, timer);
  }

  private enforceBufferLimit(): void {
    if (this.buffers.size <= this.config.maxBuffers) return;

    const activeBuffers = Array.from(this.buffers.values())
      .filter(b => !b.cleared)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const toClear = activeBuffers.slice(0, activeBuffers.length - this.config.maxBuffers + 5);
    for (const buffer of toClear) {
      this.clearBuffer(buffer.id);
    }
  }

  private overwriteString(str: string): string {
    const len = str.length;
    if (len === 0) return str;
    const garbage = '\0'.repeat(len);
    return garbage;
  }

  secureClearString(str: string): string {
    return this.overwriteString(str);
  }

  wipeUint8Array(arr: Uint8Array): void {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = 0;
    }
  }

  wipeArrayBuffer(buffer: ArrayBuffer): void {
    const view = new Uint8Array(buffer);
    this.wipeUint8Array(view);
  }

  forceGC(): void {
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as Record<string, () => void>).gc();
      } catch {
        // gc not available
      }
    }
  }

  getConfig(): MemorySecurityConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<MemorySecurityConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getStats(): MemorySecurityStats {
    const buffers = Array.from(this.buffers.values());
    const active = buffers.filter(b => !b.cleared);
    return {
      totalBuffers: buffers.length,
      activeBuffers: active.length,
      clearedBuffers: buffers.length - active.length,
      totalBytesCleared: this.totalBytesCleared,
      lastClearTime: this.lastClearTime
    };
  }

  getActiveContexts(): string[] {
    return Array.from(this.buffers.values())
      .filter(b => !b.cleared)
      .map(b => b.context);
  }

  destroy(): void {
    this.clearAllBuffers();
    this.buffers.clear();
  }
}

export const memorySecurity = new MemorySecurity();
