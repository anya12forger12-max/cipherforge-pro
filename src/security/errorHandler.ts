import { loggingSystem } from './loggingSystem';

export type ErrorCode =
  | 'UNKNOWN'
  | 'PERMISSION_DENIED'
  | 'FILE_NOT_FOUND'
  | 'FILE_CORRUPTED'
  | 'UNSUPPORTED_ENCODING'
  | 'MISSING_ASSET'
  | 'CONFIG_FAILURE'
  | 'WORKSPACE_CORRUPTED'
  | 'PLUGIN_FAILURE'
  | 'MEMORY_PRESSURE'
  | 'DISK_FULL'
  | 'OPERATION_CANCELLED'
  | 'INVALID_INPUT'
  | 'VALIDATION_FAILED'
  | 'INTEGRITY_CHECK_FAILED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'RESOURCE_EXHAUSTED'
  | 'CONCURRENT_MODIFICATION'
  | 'DEPENDENCY_CONFLICT';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
  id: string;
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  stack?: string;
  context?: Record<string, unknown>;
  recoverable: boolean;
  recoverySuggestion?: string;
  userAction?: string;
  module?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

export interface ErrorHandlerConfig {
  maxErrors: number;
  logErrors: boolean;
  showToasts: boolean;
  autoRecover: boolean;
  retryAttempts: number;
  retryDelayMs: number;
}

const DEFAULT_CONFIG: ErrorHandlerConfig = {
  maxErrors: 500,
  logErrors: true,
  showToasts: true,
  autoRecover: true,
  retryAttempts: 3,
  retryDelayMs: 1000
};

const ERROR_SEVERITY_MAP: Record<ErrorCode, ErrorSeverity> = {
  UNKNOWN: 'medium',
  PERMISSION_DENIED: 'high',
  FILE_NOT_FOUND: 'medium',
  FILE_CORRUPTED: 'high',
  UNSUPPORTED_ENCODING: 'medium',
  MISSING_ASSET: 'medium',
  CONFIG_FAILURE: 'high',
  WORKSPACE_CORRUPTED: 'critical',
  PLUGIN_FAILURE: 'medium',
  MEMORY_PRESSURE: 'high',
  DISK_FULL: 'critical',
  OPERATION_CANCELLED: 'low',
  INVALID_INPUT: 'low',
  VALIDATION_FAILED: 'low',
  INTEGRITY_CHECK_FAILED: 'high',
  NETWORK_ERROR: 'medium',
  TIMEOUT: 'medium',
  RESOURCE_EXHAUSTED: 'high',
  CONCURRENT_MODIFICATION: 'medium',
  DEPENDENCY_CONFLICT: 'medium'
};

const RECOVERY_SUGGESTIONS: Partial<Record<ErrorCode, string>> = {
  PERMISSION_DENIED: 'Check file permissions and try again.',
  FILE_NOT_FOUND: 'Verify the file exists and the path is correct.',
  FILE_CORRUPTED: 'The file may be damaged. Try restoring from a backup.',
  UNSUPPORTED_ENCODING: 'Try converting the file to UTF-8 encoding first.',
  MISSING_ASSET: 'Reinstall the application or verify asset files.',
  CONFIG_FAILURE: 'Reset configuration to defaults from Settings.',
  WORKSPACE_CORRUPTED: 'Use the Recovery Center to restore a previous workspace checkpoint.',
  PLUGIN_FAILURE: 'Disable the problematic plugin and restart.',
  MEMORY_PRESSURE: 'Close other applications or reduce the workload.',
  DISK_FULL: 'Free up disk space before continuing.',
  INVALID_INPUT: 'Review your input and correct any errors.',
  VALIDATION_FAILED: 'The data does not meet requirements. Check the validation details.',
  INTEGRITY_CHECK_FAILED: 'Data integrity check failed. The file may have been modified.',
  NETWORK_ERROR: 'Check your network connection.',
  TIMEOUT: 'The operation took too long. Try a smaller input or simpler operation.',
  RESOURCE_EXHAUSTED: 'System resources are low. Try again later.',
  CONCURRENT_MODIFICATION: 'The file was modified by another process. Reload and try again.',
  DEPENDENCY_CONFLICT: 'There is a dependency conflict. Check plugin compatibility.'
};

type ErrorCallback = (error: AppError) => void;

export class ErrorHandler {
  private errors: AppError[] = [];
  private config: ErrorHandlerConfig;
  private listeners: Set<ErrorCallback> = new Set();

  constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  handleError(
    code: ErrorCode,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: Record<string, unknown>;
      stack?: string;
      recoverable?: boolean;
      module?: string;
    }
  ): AppError {
    const error: AppError = {
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      code,
      message,
      severity: options?.severity || ERROR_SEVERITY_MAP[code],
      timestamp: new Date(),
      stack: options?.stack || new Error().stack,
      context: options?.context,
      recoverable: options?.recoverable ?? (RECOVERY_SUGGESTIONS[code] !== undefined),
      recoverySuggestion: RECOVERY_SUGGESTIONS[code],
      module: options?.module
    };

    this.errors.push(error);
    this.enforceLimit();

    if (this.config.logErrors) {
      const logFn = error.severity === 'critical' ? loggingSystem.critical :
                    error.severity === 'high' ? loggingSystem.error :
                    error.severity === 'medium' ? loggingSystem.warn :
                    loggingSystem.info;
      logFn('ErrorHandler', `[${code}] ${message}`, { stack: error.stack, context: error.context, module: error.module } as unknown as Error & Record<string, unknown>);
    }

    this.notifyListeners(error);

    return error;
  }

  handleCaughtError(error: Error, module?: string, context?: Record<string, unknown>): AppError {
    const code = this.classifyError(error);
    return this.handleError(code, error.message, {
      stack: error.stack,
      context,
      module
    });
  }

  private classifyError(error: Error): ErrorCode {
    const msg = error.message.toLowerCase();
    if (msg.includes('permission') || msg.includes('eacces')) return 'PERMISSION_DENIED';
    if (msg.includes('enoent') || msg.includes('not found')) return 'FILE_NOT_FOUND';
    if (msg.includes('corrupt') || msg.includes('invalid')) return 'FILE_CORRUPTED';
    if (msg.includes('encoding') || msg.includes('utf')) return 'UNSUPPORTED_ENCODING';
    if (msg.includes('memory') || msg.includes('heap')) return 'MEMORY_PRESSURE';
    if (msg.includes('disk') || msg.includes('space') || msg.includes('quota')) return 'DISK_FULL';
    if (msg.includes('timeout')) return 'TIMEOUT';
    if (msg.includes('network') || msg.includes('fetch')) return 'NETWORK_ERROR';
    return 'UNKNOWN';
  }

  async retryOperation<T>(
    operation: () => Promise<T>,
    options?: {
      maxAttempts?: number;
      delayMs?: number;
      backoffMultiplier?: number;
      module?: string;
    }
  ): Promise<T> {
    const maxAttempts = options?.maxAttempts ?? this.config.retryAttempts;
    const baseDelay = options?.delayMs ?? this.config.retryDelayMs;
    const backoff = options?.backoffMultiplier ?? 2;

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.handleCaughtError(lastError, options?.module, { attempt, maxAttempts });

        if (attempt < maxAttempts) {
          const delay = baseDelay * Math.pow(backoff, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  onError(callback: ErrorCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(error: AppError): void {
    this.listeners.forEach(cb => cb(error));
  }

  getErrors(count?: number): AppError[] {
    const errors = [...this.errors].reverse();
    return count ? errors.slice(0, count) : errors;
  }

  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errors.filter(e => e.severity === severity);
  }

  getErrorsByCode(code: ErrorCode): AppError[] {
    return this.errors.filter(e => e.code === code);
  }

  getErrorsByModule(module: string): AppError[] {
    return this.errors.filter(e => e.module === module);
  }

  getRecoverableErrors(): AppError[] {
    return this.errors.filter(e => e.recoverable);
  }

  clearErrors(): void {
    this.errors = [];
  }

  getStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCode: Record<string, number>;
    recoverable: number;
  } {
    const bySeverity: Record<ErrorSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const byCode: Record<string, number> = {};
    let recoverable = 0;

    for (const error of this.errors) {
      bySeverity[error.severity]++;
      byCode[error.code] = (byCode[error.code] || 0) + 1;
      if (error.recoverable) recoverable++;
    }

    return { total: this.errors.length, bySeverity, byCode, recoverable };
  }

  private enforceLimit(): void {
    if (this.errors.length > this.config.maxErrors) {
      this.errors = this.errors.slice(-this.config.maxErrors);
    }
  }

  getConfig(): ErrorHandlerConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export const errorHandler = new ErrorHandler();
