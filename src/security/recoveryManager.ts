export interface RecoveryCheckpoint {
  id: string;
  timestamp: Date;
  type: 'auto' | 'manual' | 'crash';
  data: {
    workspaceId?: string;
    workspaceSnapshot?: string;
    settingsSnapshot?: string;
    recentFiles?: string[];
  };
  size: number;
  isValid: boolean;
}

export interface RecoveryBackup {
  id: string;
  name: string;
  createdAt: Date;
  size: number;
  checksum: string;
  description: string;
  isAutomatic: boolean;
}

export interface RecoveryReport {
  id: string;
  timestamp: Date;
  issuesFound: number;
  issuesFixed: number;
  backupsAvailable: number;
  checkpointsAvailable: number;
  recommendations: string[];
  success: boolean;
}

export interface CrashLog {
  id: string;
  timestamp: Date;
  error: string;
  stack?: string;
  lastOperation: string;
  recoveredData: boolean;
}

export class RecoveryManager {
  private checkpoints: Map<string, RecoveryCheckpoint> = new Map();
  private backups: Map<string, RecoveryBackup> = new Map();
  private crashLogs: CrashLog[] = [];
  private maxCheckpoints: number = 10;
  private maxBackups: number = 5;

  constructor() {
    this.loadFromStorage();
  }

  createCheckpoint(type: RecoveryCheckpoint['type'], data: RecoveryCheckpoint['data']): RecoveryCheckpoint {
    const checkpoint: RecoveryCheckpoint = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      data,
      size: JSON.stringify(data).length,
      isValid: true
    };

    this.checkpoints.set(checkpoint.id, checkpoint);
    this.enforceLimits();
    this.saveToStorage();
    return checkpoint;
  }

  getCheckpoint(id: string): RecoveryCheckpoint | undefined {
    return this.checkpoints.get(id);
  }

  getAllCheckpoints(): RecoveryCheckpoint[] {
    return Array.from(this.checkpoints.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  restoreCheckpoint(id: string): RecoveryCheckpoint | undefined {
    const checkpoint = this.checkpoints.get(id);
    if (!checkpoint || !checkpoint.isValid) return undefined;
    return checkpoint;
  }

  deleteCheckpoint(id: string): boolean {
    return this.checkpoints.delete(id);
  }

  createBackup(name: string, data: string, description: string = ''): Promise<RecoveryBackup> {
    return this.generateChecksum(data).then(checksum => {
      const backup: RecoveryBackup = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date(),
        size: new Blob([data]).size,
        checksum,
        description,
        isAutomatic: false
      };

      this.backups.set(backup.id, backup);
      this.enforceLimits();
      this.saveToStorage();
      return backup;
    });
  }

  getBackup(id: string): RecoveryBackup | undefined {
    return this.backups.get(id);
  }

  getAllBackups(): RecoveryBackup[] {
    return Array.from(this.backups.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  deleteBackup(id: string): boolean {
    return this.backups.delete(id);
  }

  async verifyBackup(id: string, data: string): Promise<boolean> {
    const backup = this.backups.get(id);
    if (!backup) return false;

    const checksum = await this.generateChecksum(data);
    return checksum === backup.checksum;
  }

  logCrash(error: string, stack?: string, lastOperation: string = 'unknown'): CrashLog {
    const crashLog: CrashLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      error,
      stack,
      lastOperation,
      recoveredData: false
    };

    this.crashLogs.push(crashLog);
    this.saveToStorage();
    return crashLog;
  }

  getCrashLogs(): CrashLog[] {
    return [...this.crashLogs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  clearCrashLogs(): void {
    this.crashLogs = [];
    this.saveToStorage();
  }

  async runRecovery(): Promise<RecoveryReport> {
    const issues: string[] = [];
    let issuesFixed = 0;

    // Check for invalid checkpoints
    for (const [id, checkpoint] of this.checkpoints) {
      if (!checkpoint.isValid) {
        issues.push(`Invalid checkpoint found: ${id}`);
        this.checkpoints.delete(id);
        issuesFixed++;
      }
    }

    // Check for corrupted backups
    for (const [id, backup] of this.backups) {
      if (backup.size === 0) {
        issues.push(`Empty backup found: ${backup.name}`);
        this.backups.delete(id);
        issuesFixed++;
      }
    }

    const recommendations: string[] = [];
    if (this.checkpoints.size < 3) {
      recommendations.push('Consider creating more recovery checkpoints');
    }
    if (this.backups.size === 0) {
      recommendations.push('Create a backup of your important workspaces');
    }

    this.saveToStorage();

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      issuesFound: issues.length,
      issuesFixed,
      backupsAvailable: this.backups.size,
      checkpointsAvailable: this.checkpoints.size,
      recommendations,
      success: issues.length === 0 || issuesFixed === issues.length
    };
  }

  getRecoveryStats(): {
    totalCheckpoints: number;
    totalBackups: number;
    totalCrashes: number;
    lastCheckpoint: Date | null;
    lastBackup: Date | null;
  } {
    const checkpoints = this.getAllCheckpoints();
    const backups = this.getAllBackups();

    return {
      totalCheckpoints: checkpoints.length,
      totalBackups: backups.length,
      totalCrashes: this.crashLogs.length,
      lastCheckpoint: checkpoints.length > 0 ? checkpoints[0].timestamp : null,
      lastBackup: backups.length > 0 ? backups[0].createdAt : null
    };
  }

  private enforceLimits(): void {
    const checkpoints = this.getAllCheckpoints();
    if (checkpoints.length > this.maxCheckpoints) {
      const toDelete = checkpoints.slice(this.maxCheckpoints);
      for (const cp of toDelete) {
        this.checkpoints.delete(cp.id);
      }
    }

    const backups = this.getAllBackups();
    if (backups.length > this.maxBackups) {
      const toDelete = backups.slice(this.maxBackups);
      for (const backup of toDelete) {
        this.backups.delete(backup.id);
      }
    }
  }

  private async generateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private saveToStorage(): void {
    const data = {
      checkpoints: Array.from(this.checkpoints.values()),
      backups: Array.from(this.backups.values()),
      crashLogs: this.crashLogs
    };
    localStorage.setItem('cipherforge-recovery', JSON.stringify(data));
  }

  private loadFromStorage(): void {
    const saved = localStorage.getItem('cipherforge-recovery');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.checkpoints) {
        for (const cp of data.checkpoints) {
          this.checkpoints.set(cp.id, cp);
        }
      }
      if (data.backups) {
        for (const backup of data.backups) {
          this.backups.set(backup.id, backup);
        }
      }
      if (data.crashLogs) {
        this.crashLogs = data.crashLogs;
      }
    }
  }
}

export const recoveryManager = new RecoveryManager();
