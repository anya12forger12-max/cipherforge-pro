export interface ResourceUsage {
  cpu: CpuUsage;
  memory: MemoryUsage;
  disk: DiskUsage;
  timestamp: Date;
}

export interface CpuUsage {
  cores: number;
  usagePercentage: number;
  temperature?: number;
}

export interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

export interface DiskUsage {
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
  usagePercentage: number;
}

export interface ResourceAlert {
  id: string;
  type: 'memory' | 'disk' | 'cpu' | 'thread';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface ProcessingJob {
  id: string;
  name: string;
  type: string;
  startTime: Date;
  estimatedDuration?: number;
  progress: number;
  status: 'running' | 'paused' | 'completed' | 'error';
  memoryUsed: number;
}

export class ResourceMonitor {
  private alerts: ResourceAlert[] = [];
  private activeJobs: Map<string, ProcessingJob> = new Map();
  private usageHistory: ResourceUsage[] = [];
  private maxHistorySize: number = 100;

  private thresholds = {
    memoryWarning: 80,
    memoryCritical: 90,
    diskWarning: 85,
    diskCritical: 95,
    cpuWarning: 80,
    cpuCritical: 95
  };

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Monitor memory usage periodically
    if (typeof window !== 'undefined' && 'memory' in performance) {
      setInterval(() => {
        this.checkMemoryUsage();
      }, 5000);
    }
  }

  private checkMemoryUsage(): void {
    const usage = this.getCurrentUsage();
    this.usageHistory.push(usage);
    
    if (this.usageHistory.length > this.maxHistorySize) {
      this.usageHistory.shift();
    }

    // Check memory thresholds
    if (usage.memory.usagePercentage >= this.thresholds.memoryCritical) {
      this.addAlert('memory', 'critical', 
        `Memory usage critical: ${usage.memory.usagePercentage.toFixed(1)}%`,
        usage.memory.usagePercentage, this.thresholds.memoryCritical);
    } else if (usage.memory.usagePercentage >= this.thresholds.memoryWarning) {
      this.addAlert('memory', 'warning',
        `Memory usage high: ${usage.memory.usagePercentage.toFixed(1)}%`,
        usage.memory.usagePercentage, this.thresholds.memoryWarning);
    }
  }

  getCurrentUsage(): ResourceUsage {
    const memory = this.getMemoryUsage();
    const cpu = this.getCpuUsage();
    const disk = this.getDiskUsage();

    return {
      cpu,
      memory,
      disk,
      timestamp: new Date()
    };
  }

  private getMemoryUsage(): MemoryUsage {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }

    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      usagePercentage: 0
    };
  }

  private getCpuUsage(): CpuUsage {
    return {
      cores: navigator.hardwareConcurrency || 4,
      usagePercentage: 0
    };
  }

  private getDiskUsage(): DiskUsage {
    return {
      totalSpace: 0,
      usedSpace: 0,
      freeSpace: 0,
      usagePercentage: 0
    };
  }

  private addAlert(type: ResourceAlert['type'], severity: ResourceAlert['severity'],
    message: string, value: number, threshold: number): void {
    const alert: ResourceAlert = {
      id: crypto.randomUUID(),
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: new Date()
    };

    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
  }

  startJob(name: string, type: string, estimatedDuration?: number): ProcessingJob {
    const job: ProcessingJob = {
      id: crypto.randomUUID(),
      name,
      type,
      startTime: new Date(),
      estimatedDuration,
      progress: 0,
      status: 'running',
      memoryUsed: 0
    };

    this.activeJobs.set(job.id, job);
    return job;
  }

  updateJobProgress(jobId: string, progress: number): void {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.progress = Math.min(100, progress);
    }
  }

  completeJob(jobId: string): void {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.progress = 100;
    }
  }

  pauseJob(jobId: string): void {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'paused';
    }
  }

  resumeJob(jobId: string): void {
    const job = this.activeJobs.get(jobId);
    if (job && job.status === 'paused') {
      job.status = 'running';
    }
  }

  cancelJob(jobId: string): void {
    this.activeJobs.delete(jobId);
  }

  getActiveJobs(): ProcessingJob[] {
    return Array.from(this.activeJobs.values());
  }

  getAlerts(): ResourceAlert[] {
    return [...this.alerts];
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  getUsageHistory(): ResourceUsage[] {
    return [...this.usageHistory];
  }

  getAverageMemoryUsage(): number {
    if (this.usageHistory.length === 0) return 0;
    const sum = this.usageHistory.reduce((acc, usage) => acc + usage.memory.usagePercentage, 0);
    return sum / this.usageHistory.length;
  }

  isMemoryPressure(): boolean {
    const current = this.getCurrentUsage();
    return current.memory.usagePercentage >= this.thresholds.memoryWarning;
  }

  getPerformanceStats(): {
    averageProcessingTime: number;
    memoryEfficiency: number;
    activeJobCount: number;
    alertCount: number;
  } {
    const jobs = Array.from(this.activeJobs.values());
    const completedJobs = jobs.filter(j => j.status === 'completed');
    
    let averageProcessingTime = 0;
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((acc, job) => {
        return acc + (Date.now() - job.startTime.getTime());
      }, 0);
      averageProcessingTime = totalTime / completedJobs.length;
    }

    return {
      averageProcessingTime,
      memoryEfficiency: 100 - this.getAverageMemoryUsage(),
      activeJobCount: this.activeJobs.size,
      alertCount: this.alerts.length
    };
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const resourceMonitor = new ResourceMonitor();
