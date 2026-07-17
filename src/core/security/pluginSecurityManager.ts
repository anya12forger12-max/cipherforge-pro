export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: PluginPermission[];
  dependencies: string[];
  entryPoint: string;
  minAppVersion: string;
  maxAppVersion?: string;
  signature?: string;
}

export type PluginPermission = 
  | 'read:files' 
  | 'write:files' 
  | 'read:clipboard' 
  | 'write:clipboard'
  | 'network:optional'
  | 'storage:local'
  | 'ui:panels'
  | 'ui:notifications';

export interface PluginSecurityStatus {
  pluginId: string;
  isValid: boolean;
  hasValidSignature: boolean;
  permissions: PluginPermission[];
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  errors: string[];
  lastChecked: Date;
}

export interface PluginAuditResult {
  pluginId: string;
  pluginName: string;
  manifestValid: boolean;
  permissionsValid: boolean;
  dependenciesValid: boolean;
  signatureValid: boolean;
  overallRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export class PluginSecurityManager {
  private pluginStatuses: Map<string, PluginSecurityStatus> = new Map();
  private registeredPlugins: Map<string, PluginManifest> = new Map();

  validateManifest(manifest: PluginManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.id || manifest.id.length < 3) {
      errors.push('Plugin ID must be at least 3 characters');
    }

    if (!manifest.name || manifest.name.length < 1) {
      errors.push('Plugin name is required');
    }

    if (!this.isValidVersion(manifest.version)) {
      errors.push('Invalid version format (expected semver)');
    }

    if (!manifest.entryPoint) {
      errors.push('Entry point is required');
    }

    if (manifest.permissions.some(p => !this.isValidPermission(p))) {
      errors.push('Invalid permission specified');
    }

    return { valid: errors.length === 0, errors };
  }

  private isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  private isValidPermission(permission: string): boolean {
    const validPermissions: PluginPermission[] = [
      'read:files', 'write:files', 'read:clipboard', 'write:clipboard',
      'network:optional', 'storage:local', 'ui:panels', 'ui:notifications'
    ];
    return validPermissions.includes(permission as PluginPermission);
  }

  assessRisk(manifest: PluginManifest): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // High-risk permissions
    if (manifest.permissions.includes('write:files')) riskScore += 3;
    if (manifest.permissions.includes('write:clipboard')) riskScore += 2;
    if (manifest.permissions.includes('network:optional')) riskScore += 2;
    if (manifest.permissions.includes('storage:local')) riskScore += 1;

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  registerPlugin(manifest: PluginManifest): PluginSecurityStatus {
    const validation = this.validateManifest(manifest);
    const riskLevel = this.assessRisk(manifest);
    const warnings: string[] = [];

    if (!manifest.signature) {
      warnings.push('Plugin is unsigned - verify authenticity before use');
    }

    if (manifest.permissions.length > 3) {
      warnings.push('Plugin requests many permissions - review carefully');
    }

    const status: PluginSecurityStatus = {
      pluginId: manifest.id,
      isValid: validation.valid,
      hasValidSignature: !!manifest.signature,
      permissions: manifest.permissions,
      riskLevel,
      warnings,
      errors: validation.errors,
      lastChecked: new Date()
    };

    this.pluginStatuses.set(manifest.id, status);
    this.registeredPlugins.set(manifest.id, manifest);
    return status;
  }

  unregisterPlugin(pluginId: string): boolean {
    this.pluginStatuses.delete(pluginId);
    return this.registeredPlugins.delete(pluginId);
  }

  getPluginStatus(pluginId: string): PluginSecurityStatus | undefined {
    return this.pluginStatuses.get(pluginId);
  }

  getAllPluginStatuses(): PluginSecurityStatus[] {
    return Array.from(this.pluginStatuses.values());
  }

  getPluginsByRiskLevel(riskLevel: 'low' | 'medium' | 'high'): PluginSecurityStatus[] {
    return Array.from(this.pluginStatuses.values())
      .filter(s => s.riskLevel === riskLevel);
  }

  auditPlugin(pluginId: string): PluginAuditResult | undefined {
    const manifest = this.registeredPlugins.get(pluginId);
    if (!manifest) return undefined;

    const manifestValidation = this.validateManifest(manifest);
    const recommendations: string[] = [];

    if (!manifest.signature) {
      recommendations.push('Request signed version from developer');
    }

    if (manifest.permissions.includes('write:files')) {
      recommendations.push('Review file write permissions carefully');
    }

    if (manifest.permissions.includes('network:optional')) {
      recommendations.push('Verify network access is truly optional');
    }

    return {
      pluginId,
      pluginName: manifest.name,
      manifestValid: manifestValidation.valid,
      permissionsValid: manifest.permissions.every(p => this.isValidPermission(p)),
      dependenciesValid: true,
      signatureValid: !!manifest.signature,
      overallRisk: this.assessRisk(manifest),
      recommendations
    };
  }

  generateSecurityReport(): {
    totalPlugins: number;
    validPlugins: number;
    invalidPlugins: number;
    unsignedPlugins: number;
    riskDistribution: Record<string, number>;
    recommendations: string[];
  } {
    const statuses = Array.from(this.pluginStatuses.values());
    const validPlugins = statuses.filter(s => s.isValid).length;
    const unsignedPlugins = statuses.filter(s => !s.hasValidSignature).length;

    const riskDistribution: Record<string, number> = { low: 0, medium: 0, high: 0 };
    for (const status of statuses) {
      riskDistribution[status.riskLevel]++;
    }

    const recommendations: string[] = [];
    if (unsignedPlugins > 0) {
      recommendations.push('Review unsigned plugins for security risks');
    }
    if (riskDistribution.high > 0) {
      recommendations.push('Audit plugins with high risk level');
    }

    return {
      totalPlugins: statuses.length,
      validPlugins,
      invalidPlugins: statuses.length - validPlugins,
      unsignedPlugins,
      riskDistribution,
      recommendations
    };
  }

  checkPermission(pluginId: string, permission: PluginPermission): boolean {
    const status = this.pluginStatuses.get(pluginId);
    if (!status || !status.isValid) return false;
    return status.permissions.includes(permission);
  }
}

export const pluginSecurityManager = new PluginSecurityManager();
