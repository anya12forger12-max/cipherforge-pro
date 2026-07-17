import { loggingSystem } from '../security/loggingSystem';
import { inputValidator } from '../security/inputValidator';
import { errorHandler } from '../security/errorHandler';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  category: PluginCategory;
  permissions: PluginPermission[];
  dependencies?: Record<string, string>;
  entryPoint: string;
  icon?: string;
  minAppVersion?: string;
  maxAppVersion?: string;
  homepage?: string;
  repository?: string;
}

export type PluginCategory =
  | 'cipher-algorithm'
  | 'cryptanalysis-engine'
  | 'visualization-component'
  | 'language-pack'
  | 'report-template'
  | 'import-export-provider'
  | 'theme'
  | 'accessibility-extension'
  | 'educational-module'
  | 'file-format-parser';

export type PluginPermission =
  | 'read-files'
  | 'write-files'
  | 'network'
  | 'clipboard'
  | 'system-info'
  | 'crypto'
  | 'ui'
  | 'storage';

export interface PluginInstance {
  id: string;
  manifest: PluginManifest;
  enabled: boolean;
  loaded: boolean;
  instance: Record<string, unknown> | null;
  loadTime: Date;
  errorCount: number;
  lastError?: string;
}

export interface PluginAuditResult {
  pluginId: string;
  timestamp: Date;
  manifestValid: boolean;
  permissionsValid: boolean;
  versionCompatible: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  issues: string[];
  score: number;
}

export interface PluginManagerConfig {
  maxPlugins: number;
  sandboxEnabled: boolean;
  unsignedPluginWarning: boolean;
  enableIsolation: boolean;
  autoDisableOnFailure: boolean;
  maxFailuresBeforeDisable: number;
}

const DEFAULT_CONFIG: PluginManagerConfig = {
  maxPlugins: 50,
  sandboxEnabled: false,
  unsignedPluginWarning: true,
  enableIsolation: true,
  autoDisableOnFailure: true,
  maxFailuresBeforeDisable: 5
};

const REQUIRED_MANIFEST_FIELDS = ['id', 'name', 'version', 'description', 'author', 'entryPoint'];
const VALID_CATEGORIES: PluginCategory[] = [
  'cipher-algorithm', 'cryptanalysis-engine', 'visualization-component',
  'language-pack', 'report-template', 'import-export-provider',
  'theme', 'accessibility-extension', 'educational-module', 'file-format-parser'
];

export class PluginManager {
  private plugins: Map<string, PluginInstance> = new Map();
  private config: PluginManagerConfig;

  constructor(config?: Partial<PluginManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  validateManifest(manifest: PluginManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const field of REQUIRED_MANIFEST_FIELDS) {
      if (!manifest[field as keyof PluginManifest]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (manifest.version && !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(manifest.version)) {
      errors.push('Version must follow semver format (e.g., 1.0.0)');
    }

    if (manifest.category && !VALID_CATEGORIES.includes(manifest.category)) {
      errors.push(`Invalid category: ${manifest.category}`);
    }

    if (manifest.permissions) {
      for (const perm of manifest.permissions) {
        const validation = inputValidator.validatePluginManifest({ permissions: [perm] });
        if (!validation.valid) {
          errors.push(`Invalid permission: ${perm}`);
        }
      }
    }

    if (manifest.minAppVersion && manifest.maxAppVersion) {
      if (this.compareVersions(manifest.minAppVersion, manifest.maxAppVersion) > 0) {
        errors.push('minAppVersion is greater than maxAppVersion');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0;
      const nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  registerPlugin(manifest: PluginManifest): { success: boolean; error?: string } {
    if (this.plugins.size >= this.config.maxPlugins) {
      return { success: false, error: 'Maximum plugin limit reached' };
    }

    if (this.plugins.has(manifest.id)) {
      return { success: false, error: 'Plugin already registered' };
    }

    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }

    if (this.config.unsignedPluginWarning) {
      loggingSystem.warn('PluginManager', `Plugin "${manifest.name}" is unsigned. Use with caution.`);
    }

    const plugin: PluginInstance = {
      id: manifest.id,
      manifest,
      enabled: true,
      loaded: false,
      instance: null,
      loadTime: new Date(),
      errorCount: 0
    };

    this.plugins.set(manifest.id, plugin);
    loggingSystem.info('PluginManager', `Registered plugin: ${manifest.name} v${manifest.version}`);
    return { success: true };
  }

  unregisterPlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    this.unloadPlugin(id);
    this.plugins.delete(id);
    loggingSystem.info('PluginManager', `Unregistered plugin: ${id}`);
    return true;
  }

  loadPlugin(id: string): { success: boolean; error?: string } {
    const plugin = this.plugins.get(id);
    if (!plugin) return { success: false, error: 'Plugin not found' };
    if (plugin.loaded) return { success: true };

    try {
      const sandboxProxy = this.createSandboxProxy(plugin);
      plugin.instance = sandboxProxy;
      plugin.loaded = true;
      plugin.loadTime = new Date();
      loggingSystem.info('PluginManager', `Loaded plugin: ${plugin.manifest.name}`);
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      plugin.errorCount++;
      plugin.lastError = errorMsg;

      if (this.config.autoDisableOnFailure && plugin.errorCount >= this.config.maxFailuresBeforeDisable) {
        plugin.enabled = false;
        loggingSystem.warn('PluginManager', `Auto-disabled plugin ${id} after ${plugin.errorCount} failures`);
      }

      loggingSystem.error('PluginManager', `Failed to load plugin: ${plugin.manifest.name}`, err instanceof Error ? err : undefined);
      errorHandler.handleCaughtError(err instanceof Error ? err : new Error(errorMsg), 'PluginManager', { pluginId: id });
      return { success: false, error: errorMsg };
    }
  }

  unloadPlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin || !plugin.loaded) return false;

    plugin.instance = null;
    plugin.loaded = false;
    loggingSystem.info('PluginManager', `Unloaded plugin: ${plugin.manifest.name}`);
    return true;
  }

  enablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    plugin.enabled = true;
    if (!plugin.loaded) this.loadPlugin(id);
    return true;
  }

  disablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    plugin.enabled = false;
    this.unloadPlugin(id);
    return true;
  }

  private createSandboxProxy(plugin: PluginInstance): Record<string, unknown> {
    const allowedPermissions = new Set(plugin.manifest.permissions);
    const proxy: Record<string, unknown> = {};

    if (allowedPermissions.has('ui')) {
      proxy.createElement = (tag: string, props?: Record<string, unknown>) => ({ tag, props, type: 'virtual-element' });
    }
    if (allowedPermissions.has('crypto')) {
      proxy.encrypt = (text: string, params: unknown) => ({ input: text, output: text, params });
      proxy.decrypt = (text: string, params: unknown) => ({ input: text, output: text, params });
    }
    if (allowedPermissions.has('clipboard')) {
      proxy.copyToClipboard = (text: string) => navigator.clipboard.writeText(text).catch(() => {});
    }
    if (allowedPermissions.has('system-info')) {
      proxy.getSystemInfo = () => ({
        platform: navigator.platform,
        language: navigator.language,
        userAgent: navigator.userAgent.substring(0, 100)
      });
    }
    if (allowedPermissions.has('storage')) {
      proxy.storage = {
        get: (key: string) => localStorage.getItem(`plugin-${plugin.id}-${key}`),
        set: (key: string, value: string) => localStorage.setItem(`plugin-${plugin.id}-${key}`, value),
        remove: (key: string) => localStorage.removeItem(`plugin-${plugin.id}-${key}`)
      };
    }

    return proxy;
  }

  getPlugin(id: string): PluginInstance | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  getEnabledPlugins(): PluginInstance[] {
    return this.getAllPlugins().filter(p => p.enabled);
  }

  getLoadedPlugins(): PluginInstance[] {
    return this.getAllPlugins().filter(p => p.loaded);
  }

  getPluginsByCategory(category: PluginCategory): PluginInstance[] {
    return this.getAllPlugins().filter(p => p.manifest.category === category);
  }

  auditPlugin(id: string): PluginAuditResult | undefined {
    const plugin = this.plugins.get(id);
    if (!plugin) return undefined;

    const validation = this.validateManifest(plugin.manifest);
    const issues: string[] = [...validation.errors];

    if (plugin.manifest.permissions.length > 3) {
      issues.push('Plugin requests many permissions - review carefully');
    }

    if (plugin.errorCount > 0) {
      issues.push(`Plugin has encountered ${plugin.errorCount} errors`);
    }

    const hasRiskyPerms = plugin.manifest.permissions.includes('network') || plugin.manifest.permissions.includes('write-files');
    const riskLevel = hasRiskyPerms ? 'high' : plugin.manifest.permissions.length > 2 ? 'medium' : 'low';
    const score = Math.max(0, 100 - issues.length * 15 - (riskLevel === 'high' ? 20 : riskLevel === 'medium' ? 10 : 0));

    return {
      pluginId: id,
      timestamp: new Date(),
      manifestValid: validation.valid,
      permissionsValid: !issues.some(i => i.includes('permission')),
      versionCompatible: true,
      riskLevel,
      issues,
      score
    };
  }

  getSecurityReport(): {
    totalPlugins: number;
    enabledPlugins: number;
    loadedPlugins: number;
    failedPlugins: number;
    riskDistribution: Record<string, number>;
    recommendations: string[];
  } {
    const all = this.getAllPlugins();
    const failed = all.filter(p => p.errorCount > 0);
    const riskDist: Record<string, number> = { low: 0, medium: 0, high: 0 };
    const recommendations: string[] = [];

    for (const p of all) {
      const audit = this.auditPlugin(p.id);
      if (audit) riskDist[audit.riskLevel]++;
    }

    if (failed.length > 0) recommendations.push(`${failed.length} plugin(s) have errors. Consider disabling them.`);
    if (riskDist.high > 0) recommendations.push(`${riskDist.high} plugin(s) have high risk permissions. Review their access.`);
    if (all.length > 10) recommendations.push('Consider reducing the number of active plugins.');

    return {
      totalPlugins: all.length,
      enabledPlugins: all.filter(p => p.enabled).length,
      loadedPlugins: all.filter(p => p.loaded).length,
      failedPlugins: failed.length,
      riskDistribution: riskDist,
      recommendations
    };
  }

  getConfig(): PluginManagerConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<PluginManagerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  hasPermission(id: string, permission: PluginPermission): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    return plugin.manifest.permissions.includes(permission);
  }
}

export const pluginManager = new PluginManager();
