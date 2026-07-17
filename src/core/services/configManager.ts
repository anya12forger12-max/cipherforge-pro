export interface AppConfig {
  version: string;
  lastUpdated: Date;
  general: {
    autoSave: boolean;
    autoSaveInterval: number;
    confirmOnExit: boolean;
    defaultView: string;
    startupBehavior: string;
  };
  appearance: {
    theme: string;
    fontSize: string;
    fontFamily: string;
    animations: boolean;
    density: string;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
    largeText: boolean;
    zoom: number;
  };
  privacy: {
    historyEnabled: boolean;
    analytics: boolean;
    clipboardAutoClear: number;
    clearOnExit: boolean;
  };
  security: {
    enableIntegrityChecks: boolean;
    maxFileSize: number;
    logLevel: string;
    enableCrashRecovery: boolean;
  };
  shortcuts: Record<string, string>;
}

export interface ConfigVersion {
  version: string;
  timestamp: Date;
  changes: string[];
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigError[];
  warnings: string[];
}

export interface ConfigError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export class ConfigurationManager {
  private config: AppConfig;
  private versions: ConfigVersion[] = [];
  private maxVersions: number = 10;

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadConfig();
  }

  private getDefaultConfig(): AppConfig {
    return {
      version: '1.0.0',
      lastUpdated: new Date(),
      general: {
        autoSave: true,
        autoSaveInterval: 300000,
        confirmOnExit: true,
        defaultView: 'dashboard',
        startupBehavior: 'welcome'
      },
      appearance: {
        theme: 'dark',
        fontSize: 'medium',
        fontFamily: 'Inter',
        animations: true,
        density: 'comfortable'
      },
      accessibility: {
        reducedMotion: false,
        highContrast: false,
        screenReader: false,
        keyboardNavigation: true,
        largeText: false,
        zoom: 100
      },
      privacy: {
        historyEnabled: true,
        analytics: false,
        clipboardAutoClear: 30000,
        clearOnExit: false
      },
      security: {
        enableIntegrityChecks: true,
        maxFileSize: 50 * 1024 * 1024,
        logLevel: 'info',
        enableCrashRecovery: true
      },
      shortcuts: {
        'encrypt': 'Ctrl+E',
        'decrypt': 'Ctrl+D',
        'brute-force': 'Ctrl+B',
        'frequency': 'Ctrl+F',
        'save': 'Ctrl+S',
        'open': 'Ctrl+O',
        'command-palette': 'Ctrl+P',
        'help': 'F1'
      }
    };
  }

  getConfig(): AppConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  getSection<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return JSON.parse(JSON.stringify(this.config[section]));
  }

  updateConfig(updates: Partial<AppConfig>): ConfigValidationResult {
    const validation = this.validateConfig({ ...this.config, ...updates });
    
    if (validation.isValid) {
      this.saveVersion('Configuration updated');
      this.config = { ...this.config, ...updates, lastUpdated: new Date() };
      this.saveConfig();
    }

    return validation;
  }

  updateSection<K extends keyof AppConfig>(section: K, updates: Partial<AppConfig[K]>): ConfigValidationResult {
    const currentSection = this.config[section] as Record<string, unknown>;
    const newConfig = {
      ...this.config,
      [section]: { ...currentSection, ...updates }
    } as AppConfig;

    const validation = this.validateConfig(newConfig);
    
    if (validation.isValid) {
      this.saveVersion(`Updated ${section} section`);
      this.config = newConfig;
      this.saveConfig();
    }

    return validation;
  }

  validateConfig(config: AppConfig): ConfigValidationResult {
    const errors: ConfigError[] = [];
    const warnings: string[] = [];

    // Validate general settings
    if (config.general.autoSaveInterval < 60000) {
      errors.push({
        path: 'general.autoSaveInterval',
        message: 'Auto-save interval must be at least 60 seconds',
        severity: 'error'
      });
    }

    // Validate appearance
    const validThemes = ['dark', 'light', 'high-contrast', 'cyber-green', 'midnight-blue'];
    if (!validThemes.includes(config.appearance.theme)) {
      warnings.push(`Unknown theme: ${config.appearance.theme}`);
    }

    // Validate accessibility
    if (config.accessibility.zoom < 50 || config.accessibility.zoom > 200) {
      errors.push({
        path: 'accessibility.zoom',
        message: 'Zoom must be between 50% and 200%',
        severity: 'error'
      });
    }

    // Validate security
    if (config.security.maxFileSize < 1024 * 1024) {
      warnings.push('Maximum file size is very small (less than 1MB)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  resetToDefaults(): void {
    this.saveVersion('Reset to defaults');
    this.config = this.getDefaultConfig();
    this.saveConfig();
  }

  resetSection<K extends keyof AppConfig>(section: K): void {
    const defaults = this.getDefaultConfig();
    this.saveVersion(`Reset ${section} to defaults`);
    this.config[section] = defaults[section];
    this.saveConfig();
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(data: string): ConfigValidationResult {
    try {
      const imported = JSON.parse(data) as AppConfig;
      const validation = this.validateConfig(imported);
      
      if (validation.isValid) {
        this.saveVersion('Imported configuration');
        this.config = imported;
        this.saveConfig();
      }
      
      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          path: '',
          message: 'Invalid JSON format',
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  private saveVersion(description: string): void {
    const version: ConfigVersion = {
      version: this.config.version,
      timestamp: new Date(),
      changes: [description]
    };

    this.versions.push(version);
    if (this.versions.length > this.maxVersions) {
      this.versions.shift();
    }
  }

  getVersionHistory(): ConfigVersion[] {
    return [...this.versions];
  }

  getConfigDiff(other: AppConfig): string[] {
    const diffs: string[] = [];
    const current = this.config;
    
    for (const key of Object.keys(other) as (keyof AppConfig)[]) {
      if (JSON.stringify(current[key]) !== JSON.stringify(other[key])) {
        diffs.push(`Section '${key}' differs`);
      }
    }

    return diffs;
  }

  getShortcut(action: string): string | undefined {
    return this.config.shortcuts[action];
  }

  setShortcut(action: string, shortcut: string): void {
    this.config.shortcuts[action] = shortcut;
    this.saveConfig();
  }

  getAllShortcuts(): Record<string, string> {
    return { ...this.config.shortcuts };
  }

  private saveConfig(): void {
    localStorage.setItem('cipherforge-config', JSON.stringify(this.config));
    localStorage.setItem('cipherforge-config-versions', JSON.stringify(this.versions));
  }

  private loadConfig(): void {
    const saved = localStorage.getItem('cipherforge-config');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.config = { ...this.getDefaultConfig(), ...parsed };
    }

    const versions = localStorage.getItem('cipherforge-config-versions');
    if (versions) {
      this.versions = JSON.parse(versions);
    }
  }
}

export const configManager = new ConfigurationManager();
