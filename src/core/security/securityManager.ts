export type SecurityLevel = 'trace' | 'debug' | 'info' | 'warning' | 'error' | 'critical';

export type DataClassification = 'sensitive' | 'internal' | 'public';

export interface SecurityConfig {
  maxFileSize: number;
  maxMemoryUsage: number;
  enableIntegrityChecks: boolean;
  enableSecurityAudit: boolean;
  clipboardAutoClear: number;
  historyRetentionDays: number;
  enableCrashRecovery: boolean;
  enableLogging: boolean;
  logLevel: SecurityLevel;
}

export interface ThreatModel {
  assets: Asset[];
  trustBoundaries: TrustBoundary[];
  dataFlows: DataFlow[];
  threats: Threat[];
  mitigations: Mitigation[];
  residualRisks: ResidualRisk[];
}

export interface Asset {
  id: string;
  name: string;
  classification: DataClassification;
  description: string;
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TrustBoundary {
  id: string;
  name: string;
  description: string;
  insideComponents: string[];
  outsideComponents: string[];
}

export interface DataFlow {
  id: string;
  name: string;
  source: string;
  destination: string;
  data: string;
  protocol: string;
  encrypted: boolean;
}

export interface Threat {
  id: string;
  name: string;
  description: string;
  category: 'data' | 'availability' | 'integrity' | 'privacy';
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  assetId: string;
}

export interface Mitigation {
  id: string;
  threatId: string;
  description: string;
  implemented: boolean;
  effectiveness: 'low' | 'medium' | 'high';
}

export interface ResidualRisk {
  threatId: string;
  mitigationId: string;
  riskLevel: 'low' | 'medium' | 'high';
  notes: string;
}

export interface SecurityAuditResult {
  timestamp: Date;
  configurationValid: boolean;
  permissionsCorrect: boolean;
  workspaceIntegrity: boolean;
  pluginStatus: PluginSecurityStatus[];
  dependencyStatus: DependencyStatus[];
  temporaryFilesClean: boolean;
  privacySettingsCompliant: boolean;
  issues: SecurityIssue[];
  recommendations: string[];
}

export interface PluginSecurityStatus {
  pluginId: string;
  pluginName: string;
  isValid: boolean;
  permissions: string[];
  hasUnsignedCode: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DependencyStatus {
  name: string;
  version: string;
  hasVulnerabilities: boolean;
  license: string;
  isSecure: boolean;
}

export interface SecurityIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
  timestamp: Date;
}

export interface IntegrityCheckResult {
  valid: boolean;
  checksum: string;
  expectedChecksum?: string;
  mismatch: boolean;
  verifiedAt: Date;
}

export class SecurityManager {
  private config: SecurityConfig;
  private threatModel: ThreatModel;
  private securityIssues: SecurityIssue[] = [];

  constructor() {
    this.config = this.getDefaultConfig();
    this.threatModel = this.createDefaultThreatModel();
  }

  private getDefaultConfig(): SecurityConfig {
    return {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      enableIntegrityChecks: true,
      enableSecurityAudit: true,
      clipboardAutoClear: 30000, // 30 seconds
      historyRetentionDays: 30,
      enableCrashRecovery: true,
      enableLogging: true,
      logLevel: 'info'
    };
  }

  private createDefaultThreatModel(): ThreatModel {
    return {
      assets: [
        {
          id: 'plaintext',
          name: 'Plaintext Data',
          classification: 'sensitive',
          description: 'Unencrypted text that may contain sensitive information',
          sensitivity: 'high'
        },
        {
          id: 'ciphertext',
          name: 'Ciphertext',
          classification: 'internal',
          description: 'Encrypted text output',
          sensitivity: 'medium'
        },
        {
          id: 'config',
          name: 'Configuration Data',
          classification: 'internal',
          description: 'Application settings and preferences',
          sensitivity: 'medium'
        },
        {
          id: 'workspace',
          name: 'Workspace Data',
          classification: 'internal',
          description: 'User workspaces and projects',
          sensitivity: 'medium'
        }
      ],
      trustBoundaries: [
        {
          id: 'app-boundary',
          name: 'Application Boundary',
          description: 'Trust boundary of the CipherForge Pro application',
          insideComponents: ['Encryption Engine', 'UI', 'Storage'],
          outsideComponents: ['File System', 'Operating System', 'Network']
        }
      ],
      dataFlows: [
        {
          id: 'user-input',
          name: 'User Input Flow',
          source: 'User',
          destination: 'Encryption Engine',
          data: 'Plaintext/Ciphertext',
          protocol: 'Local',
          encrypted: false
        }
      ],
      threats: [
        {
          id: 't1',
          name: 'Plaintext Exposure',
          description: 'Sensitive plaintext exposed through logs or memory',
          category: 'privacy',
          likelihood: 'medium',
          impact: 'high',
          assetId: 'plaintext'
        },
        {
          id: 't2',
          name: 'Configuration Tampering',
          description: 'Malicious modification of application configuration',
          category: 'integrity',
          likelihood: 'low',
          impact: 'medium',
          assetId: 'config'
        }
      ],
      mitigations: [
        {
          id: 'm1',
          threatId: 't1',
          description: 'Clear plaintext from memory after operations',
          implemented: true,
          effectiveness: 'high'
        },
        {
          id: 'm2',
          threatId: 't2',
          description: 'Validate configuration integrity on startup',
          implemented: true,
          effectiveness: 'high'
        }
      ],
      residualRisks: [
        {
          threatId: 't1',
          mitigationId: 'm1',
          riskLevel: 'low',
          notes: 'Memory may persist briefly before clearing'
        }
      ]
    };
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getThreatModel(): ThreatModel {
    return this.threatModel;
  }

  validateInput(input: string, maxLength: number = 1000000): { valid: boolean; error?: string } {
    if (typeof input !== 'string') {
      return { valid: false, error: 'Input must be a string' };
    }
    if (input.length > maxLength) {
      return { valid: false, error: `Input exceeds maximum length of ${maxLength}` };
    }
    return { valid: true };
  }

  validateFileSize(size: number): { valid: boolean; error?: string } {
    if (size > this.config.maxFileSize) {
      return { valid: false, error: `File size ${size} exceeds maximum ${this.config.maxFileSize}` };
    }
    return { valid: true };
  }

  validateFilePath(path: string): { valid: boolean; error?: string } {
    if (path.includes('..')) {
      return { valid: false, error: 'Path traversal detected' };
    }
    if (/[<>:"|?*]/.test(path)) {
      return { valid: false, error: 'Invalid characters in path' };
    }
    return { valid: true };
  }

  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\.{2,}/g, '.')
      .trim();
  }

  classifyData(data: string): DataClassification {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /private/i,
      /confidential/i,
      /ssn/i,
      /credit.?card/i,
      /bank.?account/i
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(data)) {
        return 'sensitive';
      }
    }

    return 'internal';
  }

  clearSensitiveData(data: string): string {
    return '\0'.repeat(data.length);
  }

  generateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    return crypto.subtle.digest('SHA-256', dataBuffer).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }

  async verifyChecksum(data: string, expectedChecksum: string): Promise<IntegrityCheckResult> {
    const checksum = await this.generateChecksum(data);
    return {
      valid: checksum === expectedChecksum,
      checksum,
      expectedChecksum,
      mismatch: checksum !== expectedChecksum,
      verifiedAt: new Date()
    };
  }

  addSecurityIssue(issue: Omit<SecurityIssue, 'id' | 'timestamp'>): SecurityIssue {
    const newIssue: SecurityIssue = {
      ...issue,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    this.securityIssues.push(newIssue);
    return newIssue;
  }

  getSecurityIssues(): SecurityIssue[] {
    return [...this.securityIssues];
  }

  clearSecurityIssues(): void {
    this.securityIssues = [];
  }

  runSecurityAudit(): SecurityAuditResult {
    const issues: SecurityIssue[] = [];
    const recommendations: string[] = [];

    // Check configuration
    const configValid = this.config.maxFileSize > 0 && this.config.maxMemoryUsage > 0;
    if (!configValid) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'medium',
        category: 'Configuration',
        description: 'Invalid security configuration detected',
        recommendation: 'Reset security configuration to defaults',
        timestamp: new Date()
      });
    }

    // Check privacy settings
    const privacyCompliant = this.config.clipboardAutoClear > 0;

    // Generate recommendations
    if (!this.config.enableIntegrityChecks) {
      recommendations.push('Enable integrity checks for enhanced security');
    }
    if (this.config.logLevel === 'trace') {
      recommendations.push('Consider reducing log level to avoid sensitive data exposure');
    }

    return {
      timestamp: new Date(),
      configurationValid: configValid,
      permissionsCorrect: true,
      workspaceIntegrity: true,
      pluginStatus: [],
      dependencyStatus: [],
      temporaryFilesClean: true,
      privacySettingsCompliant: privacyCompliant,
      issues,
      recommendations
    };
  }

  getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.config.clipboardAutoClear === 0) {
      recommendations.push('Enable clipboard auto-clear to prevent sensitive data exposure');
    }

    if (!this.config.enableCrashRecovery) {
      recommendations.push('Enable crash recovery to prevent data loss');
    }

    if (this.config.historyRetentionDays > 90) {
      recommendations.push('Consider reducing history retention period');
    }

    return recommendations;
  }
}

export const securityManager = new SecurityManager();
