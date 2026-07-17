import { loggingSystem } from './loggingSystem';

export interface ResourceSnapshot {
  timestamp: Date;
  memoryUsage: MemoryUsage | null;
  performanceMetrics: PerformanceMetrics;
  storageEstimate: StorageEstimate | null;
  threadCount: number;
  queueSize: number;
  tempStorageUsage: number;
}

export interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentage: number;
}

export interface PerformanceMetrics {
  fps: number;
  longTasks: number;
  totalBlockingTime: number;
  processingSpeed: number;
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
}

export interface StorageEstimate {
  quota: number;
  usage: number;
  percentage: number;
}

export interface ResourceWarning {
  type: 'memory' | 'disk' | 'cpu' | 'queue' | 'temp';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface ResourceLimits {
  memoryWarningThreshold: number;
  memoryCriticalThreshold: number;
  diskWarningThreshold: number;
  diskCriticalThreshold: number;
  maxQueueSize: number;
  maxTempStorage: number;
  maxLongTasks: number;
}

export type ResourceCallback = (snapshot: ResourceSnapshot) => void;
export type WarningCallback = (warning: ResourceWarning) => void;

const DEFAULT_LIMITS: ResourceLimits = {
  memoryWarningThreshold: 70,
  memoryCriticalThreshold: 90,
  diskWarningThreshold: 75,
  diskCriticalThreshold: 90,
  maxQueueSize: 100,
  maxTempStorage: 100 * 1024 * 1024,
  maxLongTasks: 10
};

export class ResourceMonitor {
  private limits: ResourceLimits;
  private history: ResourceSnapshot[] = [];
  private warnings: ResourceWarning[] = [];
  private listeners: Set<ResourceCallback> = new Set();
  private warningListeners: Set<WarningCallback> = new Set();
  private intervalId: number | null = null;
  private isMonitoring = false;
  private snapshotInterval = 5000;
  private maxHistory = 360;
  private processingTasks = new Map<string, number>();
  private longTaskCount = 0;

  constructor(limits?: Partial<ResourceLimits>) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              this.longTaskCount++;
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        // PerformanceObserver not fully supported
      }
    }
  }

  startMonitoring(intervalMs?: number): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    if (intervalMs) this.snapshotInterval = intervalMs;
    this.intervalId = window.setInterval(() => this.takeSnapshot(), this.snapshotInterval);
    this.takeSnapshot();
    loggingSystem.info('ResourceMonitor', 'Monitoring started', { interval: this.snapshotInterval });
  }

  stopMonitoring(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
    loggingSystem.info('ResourceMonitor', 'Monitoring stopped');
  }

  async takeSnapshot(): Promise<ResourceSnapshot> {
    const snapshot: ResourceSnapshot = {
      timestamp: new Date(),
      memoryUsage: this.getMemoryUsage(),
      performanceMetrics: this.getPerformanceMetrics(),
      storageEstimate: await this.getStorageEstimate(),
      threadCount: this.processingTasks.size,
      queueSize: this.getQueueSize(),
      tempStorageUsage: this.getTempStorageUsage()
    };

    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.checkThresholds(snapshot);
    this.notifyListeners(snapshot);

    return snapshot;
  }

  private getMemoryUsage(): MemoryUsage | null {
    if (typeof performance === 'undefined' || !(performance as unknown as Record<string, unknown>).memory) {
      return null;
    }
    const mem = (performance as unknown as Record<string, Record<string, number>>).memory;
    const used = mem.usedJSHeapSize || 0;
    const limit = mem.jsHeapSizeLimit || 0;
    const total = mem.totalJSHeapSize || 1;
    return {
      usedJSHeapSize: used,
      totalJSHeapSize: total,
      jsHeapSizeLimit: limit,
      percentage: limit > 0 ? Math.round((used / limit) * 100) : 0
    };
  }

  private getPerformanceMetrics(): PerformanceMetrics {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

    return {
      fps: 0,
      longTasks: this.longTaskCount,
      totalBlockingTime: this.calculateTBT(),
      processingSpeed: this.calculateProcessingSpeed(),
      navigationStart: nav ? nav.startTime : 0,
      domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
      loadComplete: nav ? nav.loadEventEnd - nav.startTime : 0
    };
  }

  private calculateTBT(): number {
    try {
      const entries = performance.getEntriesByType('longtask') as PerformanceEntry[];
      let tbt = 0;
      const now = performance.now();
      for (const entry of entries) {
        if (now - entry.startTime < 30000) {
          tbt += Math.max(0, entry.duration - 50);
        }
      }
      return Math.round(tbt);
    } catch {
      return 0;
    }
  }

  private calculateProcessingSpeed(): number {
    const start = performance.now();
    let iterations = 0;
    while (performance.now() - start < 10) {
      iterations++;
    }
    return Math.round(iterations / 10);
  }

  private async getStorageEstimate(): Promise<StorageEstimate | null> {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
      return null;
    }
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      return {
        quota,
        usage,
        percentage: quota > 0 ? Math.round((usage / quota) * 100) : 0
      };
    } catch {
      return null;
    }
  }

  private getQueueSize(): number {
    return this.processingTasks.size;
  }

  private getTempStorageUsage(): number {
    let total = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('cf-temp-')) {
        const value = sessionStorage.getItem(key);
        if (value) total += new Blob([value]).size;
      }
    }
    return total;
  }

  private checkThresholds(snapshot: ResourceSnapshot): void {
    if (snapshot.memoryUsage) {
      const memPct = snapshot.memoryUsage.percentage;
      if (memPct >= this.limits.memoryCriticalThreshold) {
        this.emitWarning('memory', 'critical', `Memory usage critical: ${memPct}%`, memPct, this.limits.memoryCriticalThreshold);
      } else if (memPct >= this.limits.memoryWarningThreshold) {
        this.emitWarning('memory', 'high', `Memory usage high: ${memPct}%`, memPct, this.limits.memoryWarningThreshold);
      }
    }

    if (snapshot.storageEstimate) {
      const diskPct = snapshot.storageEstimate.percentage;
      if (diskPct >= this.limits.diskCriticalThreshold) {
        this.emitWarning('disk', 'critical', `Storage usage critical: ${diskPct}%`, diskPct, this.limits.diskCriticalThreshold);
      } else if (diskPct >= this.limits.diskWarningThreshold) {
        this.emitWarning('disk', 'high', `Storage usage high: ${diskPct}%`, diskPct, this.limits.diskWarningThreshold);
      }
    }

    if (snapshot.queueSize >= this.limits.maxQueueSize) {
      this.emitWarning('queue', 'high', `Queue size exceeded: ${snapshot.queueSize}`, snapshot.queueSize, this.limits.maxQueueSize);
    }

    if (snapshot.tempStorageUsage >= this.limits.maxTempStorage) {
      this.emitWarning('temp', 'medium', `Temp storage exceeded: ${(snapshot.tempStorageUsage / 1024 / 1024).toFixed(1)}MB`, snapshot.tempStorageUsage, this.limits.maxTempStorage);
    }

    if (snapshot.performanceMetrics.longTasks >= this.limits.maxLongTasks) {
      this.emitWarning('cpu', 'medium', `Long tasks detected: ${snapshot.performanceMetrics.longTasks}`, snapshot.performanceMetrics.longTasks, this.limits.maxLongTasks);
    }
  }

  private emitWarning(type: ResourceWarning['type'], severity: ResourceWarning['severity'], message: string, value: number, threshold: number): void {
    const warning: ResourceWarning = { type, severity, message, value, threshold, timestamp: new Date() };
    this.warnings.push(warning);
    if (this.warnings.length > 100) this.warnings.shift();
    this.warningListeners.forEach(cb => cb(warning));
  }

  startTask(taskId: string): void {
    this.processingTasks.set(taskId, performance.now());
  }

  endTask(taskId: string): number {
    const start = this.processingTasks.get(taskId);
    this.processingTasks.delete(taskId);
    if (start) return performance.now() - start;
    return 0;
  }

  onSnapshot(callback: ResourceCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onWarning(callback: WarningCallback): () => void {
    this.warningListeners.add(callback);
    return () => this.warningListeners.delete(callback);
  }

  private notifyListeners(snapshot: ResourceSnapshot): void {
    this.listeners.forEach(cb => cb(snapshot));
  }

  getHistory(): ResourceSnapshot[] {
    return [...this.history];
  }

  getWarnings(): ResourceWarning[] {
    return [...this.warnings];
  }

  getRecentWarnings(count = 10): ResourceWarning[] {
    return this.warnings.slice(-count);
  }

  clearWarnings(): void {
    this.warnings = [];
  }

  getCurrentSnapshot(): ResourceSnapshot | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  getLimits(): ResourceLimits {
    return { ...this.limits };
  }

  updateLimits(updates: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...updates };
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  getResourceSummary(): {
    memoryMB: string;
    storageGB: string;
    uptime: string;
    tasksActive: number;
    warningsCount: number;
    avgProcessingSpeed: number;
  } {
    const latest = this.getCurrentSnapshot();
    const memMB = latest?.memoryUsage
      ? (latest.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(1)
      : 'N/A';
    const storGB = latest?.storageEstimate
      ? (latest.storageEstimate.usage / 1024 / 1024 / 1024).toFixed(2)
      : 'N/A';
    const uptime = this.formatUptime(performance.now());
    const avgSpeed = this.history.length > 0
      ? this.history.reduce((sum, s) => sum + s.performanceMetrics.processingSpeed, 0) / this.history.length
      : 0;

    return {
      memoryMB: memMB,
      storageGB: storGB,
      uptime,
      tasksActive: this.processingTasks.size,
      warningsCount: this.warnings.length,
      avgProcessingSpeed: Math.round(avgSpeed)
    };
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  clearHistory(): void {
    this.history = [];
  }

  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();
    this.warningListeners.clear();
    this.history = [];
    this.warnings = [];
    this.processingTasks.clear();
  }
}

export const resourceMonitor = new ResourceMonitor();
