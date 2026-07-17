export type LogLevel = 'trace' | 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  sanitized: boolean;
}

export interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  maxEntries: number;
  persistToStorage: boolean;
  excludeCategories: string[];
}

export interface LogStats {
  totalEntries: number;
  entriesByLevel: Record<LogLevel, number>;
  entriesByCategory: Record<string, number>;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

export class LoggingSystem {
  private entries: LogEntry[] = [];
  private config: LogConfig;

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadConfig();
  }

  private getDefaultConfig(): LogConfig {
    return {
      enabled: true,
      level: 'info',
      maxEntries: 1000,
      persistToStorage: true,
      excludeCategories: []
    };
  }

  trace(category: string, message: string, details?: Record<string, unknown>): LogEntry | null {
    return this.log('trace', category, message, details);
  }

  debug(category: string, message: string, details?: Record<string, unknown>): LogEntry | null {
    return this.log('debug', category, message, details);
  }

  info(category: string, message: string, details?: Record<string, unknown>): LogEntry | null {
    return this.log('info', category, message, details);
  }

  warn(category: string, message: string, details?: Record<string, unknown>): LogEntry | null {
    return this.log('warning', category, message, details);
  }

  error(category: string, message: string, error?: Error, details?: Record<string, unknown>): LogEntry | null {
    const logDetails = { ...details };
    if (error) {
      logDetails.errorName = error.name;
      logDetails.errorMessage = error.message;
    }
    return this.log('error', category, message, logDetails, error?.stack);
  }

  critical(category: string, message: string, error?: Error, details?: Record<string, unknown>): LogEntry | null {
    const logDetails = { ...details };
    if (error) {
      logDetails.errorName = error.name;
      logDetails.errorMessage = error.message;
    }
    return this.log('critical', category, message, logDetails, error?.stack);
  }

  private log(
    level: LogLevel,
    category: string,
    message: string,
    details?: Record<string, unknown>,
    stack?: string
  ): LogEntry | null {
    if (!this.config.enabled) return null;
    if (!this.isLevelEnabled(level)) return null;
    if (this.config.excludeCategories.includes(category)) return null;

    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      category,
      message: this.sanitizeMessage(message),
      details: details ? this.sanitizeDetails(details) : undefined,
      stack: this.sanitizeStack(stack),
      sanitized: true
    };

    this.entries.push(entry);
    this.enforceLimit();

    if (this.config.persistToStorage) {
      this.saveToStorage();
    }

    return entry;
  }

  private isLevelEnabled(level: LogLevel): boolean {
    const levels: LogLevel[] = ['trace', 'debug', 'info', 'warning', 'error', 'critical'];
    const configIndex = levels.indexOf(this.config.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= configIndex;
  }

  private sanitizeMessage(message: string): string {
    return message
      .replace(/password\s*[:=]\s*\S+/gi, 'password: [REDACTED]')
      .replace(/secret\s*[:=]\s*\S+/gi, 'secret: [REDACTED]')
      .replace(/token\s*[:=]\s*\S+/gi, 'token: [REDACTED]')
      .replace(/key\s*[:=]\s*\S+/gi, 'key: [REDACTED]');
  }

  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'authorization'];

    for (const [key, value] of Object.entries(details)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeMessage(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeStack(stack?: string): string | undefined {
    if (!stack) return undefined;
    // Remove file paths and line numbers that might contain sensitive info
    return stack.replace(/at\s+.*?\s+\(.*?\)/g, 'at [REDACTED]');
  }

  private enforceLimit(): void {
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries);
    }
  }

  getEntries(filter?: { level?: LogLevel; category?: string; startDate?: Date; endDate?: Date }): LogEntry[] {
    let entries = [...this.entries];

    if (filter?.level) {
      entries = entries.filter(e => e.level === filter.level);
    }

    if (filter?.category) {
      entries = entries.filter(e => e.category === filter.category);
    }

    if (filter?.startDate) {
      entries = entries.filter(e => e.timestamp >= filter.startDate!);
    }

    if (filter?.endDate) {
      entries = entries.filter(e => e.timestamp <= filter.endDate!);
    }

    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getRecentEntries(count: number = 50): LogEntry[] {
    return this.entries.slice(-count).reverse();
  }

  searchEntries(query: string): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.entries.filter(e => 
      e.message.toLowerCase().includes(lowerQuery) ||
      e.category.toLowerCase().includes(lowerQuery)
    ).reverse();
  }

  getStats(): LogStats {
    const entriesByLevel: Record<LogLevel, number> = {
      trace: 0, debug: 0, info: 0, warning: 0, error: 0, critical: 0
    };
    const entriesByCategory: Record<string, number> = {};

    for (const entry of this.entries) {
      entriesByLevel[entry.level]++;
      entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1;
    }

    return {
      totalEntries: this.entries.length,
      entriesByLevel,
      entriesByCategory,
      oldestEntry: this.entries.length > 0 ? this.entries[0].timestamp : null,
      newestEntry: this.entries.length > 0 ? this.entries[this.entries.length - 1].timestamp : null
    };
  }

  getConfig(): LogConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<LogConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  clearLogs(): void {
    this.entries = [];
    this.saveToStorage();
  }

  exportLogs(format: 'json' | 'text' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.entries, null, 2);
    }

    return this.entries.map(e => 
      `[${e.timestamp.toISOString()}] [${e.level.toUpperCase()}] [${e.category}] ${e.message}`
    ).join('\n');
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('cipherforge-logs', JSON.stringify(this.entries.slice(-this.config.maxEntries)));
    } catch (e) {
      // Storage full, clear old entries
      this.entries = this.entries.slice(-100);
      localStorage.setItem('cipherforge-logs', JSON.stringify(this.entries));
    }
  }

  private loadConfig(): void {
    const saved = localStorage.getItem('cipherforge-log-config');
    if (saved) {
      this.config = { ...this.getDefaultConfig(), ...JSON.parse(saved) };
    }

    const logs = localStorage.getItem('cipherforge-logs');
    if (logs) {
      try {
        this.entries = JSON.parse(logs);
      } catch (e) {
        this.entries = [];
      }
    }
  }

  private saveConfig(): void {
    localStorage.setItem('cipherforge-log-config', JSON.stringify(this.config));
  }
}

export const loggingSystem = new LoggingSystem();
