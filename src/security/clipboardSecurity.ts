export interface ClipboardEntry {
  id: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'ciphertext' | 'plaintext';
  containsSensitiveData: boolean;
  expiresAt?: Date;
}

export interface ClipboardConfig {
  enabled: boolean;
  autoClearEnabled: boolean;
  autoClearDelay: number;
  maxEntries: number;
  warnOnSensitiveCopy: boolean;
}

export class ClipboardSecurityManager {
  private entries: Map<string, ClipboardEntry> = new Map();
  private config: ClipboardConfig;
  private clearTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadConfig();
  }

  private getDefaultConfig(): ClipboardConfig {
    return {
      enabled: true,
      autoClearEnabled: true,
      autoClearDelay: 30000, // 30 seconds
      maxEntries: 10,
      warnOnSensitiveCopy: true
    };
  }

  async copyText(text: string, type: ClipboardEntry['type'] = 'text'): Promise<ClipboardEntry> {
    const containsSensitiveData = this.detectSensitiveData(text);

    const entry: ClipboardEntry = {
      id: crypto.randomUUID(),
      content: text,
      timestamp: new Date(),
      type,
      containsSensitiveData
    };

    // Write to system clipboard
    if (this.config.enabled && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }

    // Store in internal history
    this.entries.set(entry.id, entry);
    this.enforceLimit();

    // Set auto-clear timer
    if (this.config.autoClearEnabled && this.config.autoClearDelay > 0) {
      this.setAutoClearTimer(entry.id);
    }

    return entry;
  }

  async readText(): Promise<string | null> {
    if (!this.config.enabled || !navigator.clipboard) {
      return null;
    }

    try {
      return await navigator.clipboard.readText();
    } catch {
      return null;
    }
  }

  clearClipboard(): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('');
    }
  }

  clearInternalHistory(): void {
    for (const timer of this.clearTimers.values()) {
      clearTimeout(timer);
    }
    this.clearTimers.clear();
    this.entries.clear();
  }

  getEntries(): ClipboardEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getRecentEntries(count: number = 5): ClipboardEntry[] {
    return this.getEntries().slice(0, count);
  }

  deleteEntry(id: string): boolean {
    const timer = this.clearTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.clearTimers.delete(id);
    }
    return this.entries.delete(id);
  }

  private detectSensitiveData(text: string): boolean {
    const patterns = [
      /password/i,
      /secret/i,
      /private.?key/i,
      /api.?key/i,
      /token/i,
      /credit.?card/i,
      /ssn/i,
      /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/, // Credit card pattern
      /\d{3}[\s-]?\d{2}[\s-]?\d{4}/ // SSN pattern
    ];

    return patterns.some(pattern => pattern.test(text));
  }

  private setAutoClearTimer(entryId: string): void {
    const timer = setTimeout(() => {
      this.entries.delete(entryId);
      this.clearTimers.delete(entryId);
    }, this.config.autoClearDelay);

    this.clearTimers.set(entryId, timer);
  }

  private enforceLimit(): void {
    const entries = this.getEntries();
    if (entries.length > this.config.maxEntries) {
      const toDelete = entries.slice(this.config.maxEntries);
      for (const entry of toDelete) {
        this.deleteEntry(entry.id);
      }
    }
  }

  getConfig(): ClipboardConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ClipboardConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  getClipboardStats(): {
    totalEntries: number;
    sensitiveEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const entries = this.getEntries();
    const sensitiveEntries = entries.filter(e => e.containsSensitiveData).length;

    return {
      totalEntries: entries.length,
      sensitiveEntries,
      oldestEntry: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
      newestEntry: entries.length > 0 ? entries[0].timestamp : null
    };
  }

  private saveConfig(): void {
    localStorage.setItem('cipherforge-clipboard-config', JSON.stringify(this.config));
  }

  private loadConfig(): void {
    const saved = localStorage.getItem('cipherforge-clipboard-config');
    if (saved) {
      this.config = { ...this.getDefaultConfig(), ...JSON.parse(saved) };
    }
  }
}

export const clipboardSecurityManager = new ClipboardSecurityManager();
