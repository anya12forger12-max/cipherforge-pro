export { securityManager, SecurityManager } from './securityManager';
export { privacyCenter, PrivacyCenter } from './privacyCenter';
export { recoveryManager, RecoveryManager } from './recoveryManager';
export { integrityVerifier, IntegrityVerifier } from './integrityVerifier';
export { loggingSystem, LoggingSystem } from './loggingSystem';
export { pluginSecurityManager, PluginSecurityManager } from './pluginSecurityManager';
export { clipboardSecurityManager, ClipboardSecurityManager } from './clipboardSecurity';
export { securityAuditEngine, SecurityAuditEngine } from './auditEngine';
export { resourceMonitor, ResourceMonitor } from './resourceMonitor';
export { tempFileManager, TempFileManager } from './tempFileManager';
export { inputValidator, InputValidator } from './inputValidator';
export { memorySecurity, MemorySecurity } from './memorySecurity';
export { errorHandler, ErrorHandler } from './errorHandler';
export { dependencyManager, DependencyManager } from './dependencyManager';

export type {
  SecurityConfig,
  ThreatModel,
  Asset,
  TrustBoundary,
  DataFlow,
  Threat,
  Mitigation,
  ResidualRisk,
  SecurityAuditResult,
  PluginSecurityStatus,
  DependencyStatus,
  SecurityIssue,
  IntegrityCheckResult,
  DataClassification,
  SecurityLevel
} from './securityManager';

export type {
  PrivacySettings,
  PrivacyStatus,
  StorageItem,
  PrivacyAction
} from './privacyCenter';

export type {
  RecoveryCheckpoint,
  RecoveryBackup,
  RecoveryReport,
  CrashLog
} from './recoveryManager';

export type {
  IntegrityCheck,
  IntegrityReport,
  FileChecksum
} from './integrityVerifier';

export type {
  LogEntry,
  LogConfig,
  LogStats,
  LogLevel
} from './loggingSystem';

export type {
  PluginManifest,
  PluginPermission,
  PluginAuditResult
} from './pluginSecurityManager';

export type {
  ClipboardEntry,
  ClipboardConfig
} from './clipboardSecurity';

export type {
  AuditCheck,
  AuditReport,
  AuditCategory
} from './auditEngine';

export type {
  ResourceSnapshot,
  MemoryUsage,
  PerformanceMetrics,
  StorageEstimate,
  ResourceWarning,
  ResourceLimits
} from './resourceMonitor';

export type {
  TempFile,
  TempFileConfig,
  TempFileStats
} from './tempFileManager';

export type {
  InputLimits
} from './inputValidator';

export type {
  SensitiveBuffer,
  MemorySecurityConfig,
  MemorySecurityStats
} from './memorySecurity';

export type {
  ErrorCode,
  ErrorSeverity,
  AppError,
  ErrorHandlerConfig
} from './errorHandler';

export type {
  DependencyInfo,
  AuditResult,
  LicenseIssue
} from './dependencyManager';
