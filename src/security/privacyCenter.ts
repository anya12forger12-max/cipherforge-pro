export interface PrivacySettings {
  historyEnabled: boolean;
  recentFilesEnabled: boolean;
  recentWorkspacesEnabled: boolean;
  metadataEnabled: boolean;
  clipboardHistoryEnabled: boolean;
  autoClearClipboard: boolean;
  autoClearDelay: number;
  clearOnExit: boolean;
  storageLimit: number;
}

export interface PrivacyStatus {
  historyEntries: number;
  clipboardItems: number;
  temporaryFiles: number;
  storageUsed: number;
  cacheSize: number;
  lastCleanup: Date | null;
  privacyScore: number;
}

export interface StorageItem {
  id: string;
  type: 'history' | 'cache' | 'temporary' | 'export' | 'workspace';
  name: string;
  size: number;
  createdAt: Date;
  lastAccessed: Date;
  containsSensitiveData: boolean;
}

export interface PrivacyAction {
  id: string;
  type: 'clear_history' | 'clear_cache' | 'clear_temp' | 'clear_export' | 'reset_settings' | 'export_data';
  timestamp: Date;
  details: string;
  success: boolean;
}

export class PrivacyCenter {
  private settings: PrivacySettings;
  private recentActions: PrivacyAction[] = [];
  private storageItems: Map<string, StorageItem> = new Map();

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  private getDefaultSettings(): PrivacySettings {
    return {
      historyEnabled: true,
      recentFilesEnabled: true,
      recentWorkspacesEnabled: true,
      metadataEnabled: true,
      clipboardHistoryEnabled: false,
      autoClearClipboard: true,
      autoClearDelay: 30000,
      clearOnExit: false,
      storageLimit: 100 * 1024 * 1024 // 100MB
    };
  }

  getSettings(): PrivacySettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<PrivacySettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  getStatus(): PrivacyStatus {
    const items = Array.from(this.storageItems.values());
    const historyItems = items.filter(i => i.type === 'history');
    const tempItems = items.filter(i => i.type === 'temporary');
    const cacheItems = items.filter(i => i.type === 'cache');

    const totalSize = items.reduce((sum, item) => sum + item.size, 0);
    const cacheSize = cacheItems.reduce((sum, item) => sum + item.size, 0);

    const privacyScore = this.calculatePrivacyScore();

    return {
      historyEntries: historyItems.length,
      clipboardItems: 0,
      temporaryFiles: tempItems.length,
      storageUsed: totalSize,
      cacheSize,
      lastCleanup: this.getLastCleanupTime(),
      privacyScore
    };
  }

  private calculatePrivacyScore(): number {
    let score = 100;

    if (!this.settings.autoClearClipboard) score -= 20;
    if (!this.settings.clearOnExit) score -= 10;
    if (this.settings.historyEnabled && this.settings.metadataEnabled) score -= 10;
    if (this.settings.clipboardHistoryEnabled) score -= 15;

    return Math.max(0, score);
  }

  private getLastCleanupTime(): Date | null {
    const cleanupActions = this.recentActions.filter(a => 
      a.type.startsWith('clear_') && a.success
    );
    return cleanupActions.length > 0 ? cleanupActions[cleanupActions.length - 1].timestamp : null;
  }

  clearHistory(): PrivacyAction {
    const action: PrivacyAction = {
      id: crypto.randomUUID(),
      type: 'clear_history',
      timestamp: new Date(),
      details: 'Cleared all history entries',
      success: true
    };

    this.recentActions.push(action);
    localStorage.removeItem('cipherforge-history');
    return action;
  }

  clearCache(): PrivacyAction {
    const action: PrivacyAction = {
      id: crypto.randomUUID(),
      type: 'clear_cache',
      timestamp: new Date(),
      details: 'Cleared application cache',
      success: true
    };

    this.recentActions.push(action);
    // Clear cache items
    for (const [id, item] of this.storageItems) {
      if (item.type === 'cache') {
        this.storageItems.delete(id);
      }
    }
    return action;
  }

  clearTemporaryFiles(): PrivacyAction {
    const action: PrivacyAction = {
      id: crypto.randomUUID(),
      type: 'clear_temp',
      timestamp: new Date(),
      details: 'Cleared temporary files',
      success: true
    };

    this.recentActions.push(action);
    for (const [id, item] of this.storageItems) {
      if (item.type === 'temporary') {
        this.storageItems.delete(id);
      }
    }
    return action;
  }

  clearExports(): PrivacyAction {
    const action: PrivacyAction = {
      id: crypto.randomUUID(),
      type: 'clear_export',
      timestamp: new Date(),
      details: 'Cleared exported files',
      success: true
    };

    this.recentActions.push(action);
    for (const [id, item] of this.storageItems) {
      if (item.type === 'export') {
        this.storageItems.delete(id);
      }
    }
    return action;
  }

  clearAllData(): PrivacyAction {
    const action: PrivacyAction = {
      id: crypto.randomUUID(),
      type: 'clear_history',
      timestamp: new Date(),
      details: 'Cleared all local data',
      success: true
    };

    this.recentActions.push(action);
    this.storageItems.clear();
    localStorage.clear();
    return action;
  }

  resetSettings(): PrivacyAction {
    const action: PrivacyAction = {
      id: crypto.randomUUID(),
      type: 'reset_settings',
      timestamp: new Date(),
      details: 'Reset privacy settings to defaults',
      success: true
    };

    this.recentActions.push(action);
    this.settings = this.getDefaultSettings();
    this.saveSettings();
    return action;
  }

  exportPersonalData(): string {
    const data = {
      settings: this.settings,
      actions: this.recentActions,
      items: Array.from(this.storageItems.values()),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  addStorageItem(item: Omit<StorageItem, 'id'>): StorageItem {
    const newItem: StorageItem = {
      ...item,
      id: crypto.randomUUID()
    };
    this.storageItems.set(newItem.id, newItem);
    return newItem;
  }

  removeStorageItem(id: string): boolean {
    return this.storageItems.delete(id);
  }

  getStorageItems(): StorageItem[] {
    return Array.from(this.storageItems.values());
  }

  getRecentActions(): PrivacyAction[] {
    return [...this.recentActions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getStorageUsage(): { total: number; byType: Record<string, number> } {
    const items = Array.from(this.storageItems.values());
    const total = items.reduce((sum, item) => sum + item.size, 0);
    
    const byType: Record<string, number> = {};
    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + item.size;
    }

    return { total, byType };
  }

  isStorageNearLimit(): boolean {
    const { total } = this.getStorageUsage();
    return total > this.settings.storageLimit * 0.9;
  }

  private saveSettings(): void {
    localStorage.setItem('cipherforge-privacy-settings', JSON.stringify(this.settings));
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('cipherforge-privacy-settings');
    if (saved) {
      this.settings = { ...this.getDefaultSettings(), ...JSON.parse(saved) };
    }
  }
}

export const privacyCenter = new PrivacyCenter();
