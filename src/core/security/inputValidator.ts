export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: ValidationSeverity;
  field?: string;
  line?: number;
  column?: number;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface InputLimits {
  maxTextLength: number;
  maxFileNameLength: number;
  maxFilePathLength: number;
  maxFileSize: number;
  maxBatchSize: number;
  maxWorkspaceSize: number;
  maxConfigSize: number;
  maxPluginSize: number;
  maxThemeSize: number;
  maxLanguagePackSize: number;
}

const DEFAULT_LIMITS: InputLimits = {
  maxTextLength: 10 * 1024 * 1024,
  maxFileNameLength: 255,
  maxFilePathLength: 4096,
  maxFileSize: 100 * 1024 * 1024,
  maxBatchSize: 1000,
  maxWorkspaceSize: 50 * 1024 * 1024,
  maxConfigSize: 1 * 1024 * 1024,
  maxPluginSize: 10 * 1024 * 1024,
  maxThemeSize: 500 * 1024,
  maxLanguagePackSize: 2 * 1024 * 1024
};

const DANGEROUS_PATH_PATTERNS = [
  /\.\./,
  /^~/,
  /\0/,
  /^[A-Za-z]:\\\\/,
  /^\\\\/,
  /^\//,
  /\$\{/,
  /\$\(/,
  /`/,
  /;|&&|\|\|/
];

const UNSAFE_FILENAMES = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
];

const MALICIOUS_CONTENT_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
  /vbscript:/i,
  /expression\s*\(/i,
  /eval\s*\(/i,
  /document\.(cookie|write|location)/i,
  /window\.(location|open)/i,
  /\.(exe|bat|cmd|com|msi|scr|pif)\b/i,
  /\/etc\/(passwd|shadow)/i,
  /\\\\\.\\\\pipe/i
];

export class InputValidator {
  private limits: InputLimits;

  constructor(limits?: Partial<InputLimits>) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
  }

  validateText(text: string, fieldName = 'text'): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    if (typeof text !== 'string') {
      errors.push({ code: 'TYPE_ERROR', message: `${fieldName} must be a string`, severity: 'error', field: fieldName });
      return { valid: false, errors, warnings, suggestions };
    }

    if (text.length === 0) {
      warnings.push({ code: 'EMPTY_INPUT', message: `${fieldName} is empty`, field: fieldName });
    }

    if (text.length > this.limits.maxTextLength) {
      errors.push({
        code: 'MAX_LENGTH',
        message: `${fieldName} exceeds maximum length of ${this.formatSize(this.limits.maxTextLength)}`,
        severity: 'error',
        field: fieldName
      });
    }

    if (text.includes('\u0000')) {
      warnings.push({ code: 'NULL_BYTES', message: `${fieldName} contains null bytes`, field: fieldName, suggestion: 'Remove null bytes' });
    }

    const controlCharCount = (text.match(/[\x00-\x08\x0E-\x1F]/g) || []).length;
    if (controlCharCount > 0) {
      warnings.push({
        code: 'CONTROL_CHARS',
        message: `${fieldName} contains ${controlCharCount} control characters`,
        field: fieldName,
        suggestion: 'Control characters may cause unexpected behavior'
      });
    }

    for (const pattern of MALICIOUS_CONTENT_PATTERNS) {
      if (pattern.test(text)) {
        warnings.push({
          code: 'MALICIOUS_PATTERN',
          message: `${fieldName} contains potentially unsafe content pattern`,
          field: fieldName,
          suggestion: 'Ensure this content is from a trusted source'
        });
        break;
      }
    }

    return { valid: errors.length === 0, errors, warnings, suggestions };
  }

  validateFileName(filename: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    if (!filename || filename.length === 0) {
      errors.push({ code: 'EMPTY_FILENAME', message: 'Filename is empty', severity: 'error', field: 'filename' });
      return { valid: false, errors, warnings, suggestions };
    }

    if (filename.length > this.limits.maxFileNameLength) {
      errors.push({
        code: 'FILENAME_TOO_LONG',
        message: `Filename exceeds ${this.limits.maxFileNameLength} characters`,
        severity: 'error',
        field: 'filename'
      });
    }

    const nameWithoutExt = filename.split('.').slice(0, -1).join('.') || filename;
    if (UNSAFE_FILENAMES.includes(nameWithoutExt.toUpperCase())) {
      errors.push({
        code: 'RESERVED_NAME',
        message: `"${nameWithoutExt}" is a reserved system name on Windows`,
        severity: 'error',
        field: 'filename'
      });
    }

    if (/[<>:"|?*\x00-\x1f]/.test(filename)) {
      errors.push({
        code: 'INVALID_CHARS',
        message: 'Filename contains invalid characters',
        severity: 'error',
        field: 'filename'
      });
    }

    if (filename.startsWith('.') || filename.startsWith(' ')) {
      warnings.push({
        code: 'HIDDEN_OR_SPACE',
        message: 'Filename starts with a dot or space',
        field: 'filename',
        suggestion: 'Hidden or leading-space files may be hard to find'
      });
    }

    if (filename.endsWith('.')) {
      warnings.push({
        code: 'TRAILING_DOT',
        message: 'Filename ends with a dot',
        field: 'filename',
        suggestion: 'Remove trailing dots to avoid issues'
      });
    }

    return { valid: errors.length === 0, errors, warnings, suggestions };
  }

  validateFilePath(path: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    if (!path || path.length === 0) {
      errors.push({ code: 'EMPTY_PATH', message: 'Path is empty', severity: 'error', field: 'path' });
      return { valid: false, errors, warnings, suggestions };
    }

    if (path.length > this.limits.maxFilePathLength) {
      errors.push({
        code: 'PATH_TOO_LONG',
        message: `Path exceeds ${this.limits.maxFilePathLength} characters`,
        severity: 'error',
        field: 'path'
      });
    }

    for (const pattern of DANGEROUS_PATH_PATTERNS) {
      if (pattern.test(path)) {
        errors.push({
          code: 'DANGEROUS_PATH',
          message: 'Path contains potentially dangerous patterns',
          severity: 'error',
          field: 'path'
        });
        break;
      }
    }

    if (/\/\//.test(path) || /\\\\/.test(path)) {
      warnings.push({
        code: 'DOUBLE_SEPARATOR',
        message: 'Path contains consecutive separators',
        field: 'path',
        suggestion: 'Normalize the path'
      });
    }

    const ext = path.split('.').pop()?.toLowerCase();
    const unsafeExts = ['exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'pif', 'vbs', 'js', 'ws', 'wsf'];
    if (ext && unsafeExts.includes(ext)) {
      warnings.push({
        code: 'EXECUTABLE_EXTENSION',
        message: `Path points to an executable file type (.${ext})`,
        field: 'path',
        suggestion: 'Ensure this is intentional'
      });
    }

    return { valid: errors.length === 0, errors, warnings, suggestions };
  }

  validateFileSize(size: number, context?: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (typeof size !== 'number' || isNaN(size) || size < 0) {
      errors.push({ code: 'INVALID_SIZE', message: 'Invalid file size', severity: 'error', field: 'size' });
      return { valid: false, errors, warnings, suggestions: [] };
    }

    const maxSize = this.limits.maxFileSize;
    if (size > maxSize) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `File size (${this.formatSize(size)}) exceeds limit (${this.formatSize(maxSize)})`,
        severity: 'error',
        field: 'size'
      });
    } else if (size > maxSize * 0.8) {
      warnings.push({
        code: 'FILE_LARGE',
        message: `File is large (${this.formatSize(size)}). Processing may be slow.`,
        field: 'size',
        suggestion: 'Consider splitting large files'
      });
    }

    if (context === 'text' && size > 5 * 1024 * 1024) {
      warnings.push({
        code: 'LARGE_TEXT',
        message: 'Large text input may impact performance',
        suggestion: 'Break text into smaller chunks for better results'
      });
    }

    return { valid: errors.length === 0, errors, warnings, suggestions: [] };
  }

  validateFileImport(file: { name: string; size: number; type?: string }): ValidationResult {
    const nameResult = this.validateFileName(file.name);
    const sizeResult = this.validateFileSize(file.size, 'import');
    const typeResult = this.validateFileType(file.type, file.name);

    return this.mergeResults([nameResult, sizeResult, typeResult]);
  }

  validateFileType(mimeType: string | undefined, _filename: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    const allowedTypes = [
      'text/plain', 'text/csv', 'text/html', 'text/xml', 'text/json',
      'application/json', 'application/xml', 'application/javascript',
      'application/pdf', 'image/png', 'image/jpeg', 'image/gif',
      'application/octet-stream', 'application/x-empty'
    ];

    if (mimeType && !allowedTypes.includes(mimeType)) {
      warnings.push({
        code: 'UNUSUAL_MIME_TYPE',
        message: `File type "${mimeType}" may not be fully supported`,
        field: 'type',
        suggestion: 'Supported formats: TXT, CSV, JSON, XML, HTML, PDF, images'
      });
    }

    return { valid: errors.length === 0, errors, warnings, suggestions };
  }

  validatePluginManifest(manifest: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    if (!manifest.id || typeof manifest.id !== 'string') {
      errors.push({ code: 'MISSING_ID', message: 'Plugin manifest missing "id"', severity: 'error', field: 'id' });
    }

    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push({ code: 'MISSING_NAME', message: 'Plugin manifest missing "name"', severity: 'error', field: 'name' });
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push({ code: 'MISSING_VERSION', message: 'Plugin manifest missing "version"', severity: 'error', field: 'version' });
    } else if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(manifest.version as string)) {
      errors.push({ code: 'INVALID_VERSION', message: 'Version must follow semver (e.g., 1.0.0)', severity: 'error', field: 'version' });
    }

    if (!manifest.description || typeof manifest.description !== 'string') {
      warnings.push({ code: 'MISSING_DESCRIPTION', message: 'Plugin missing description', field: 'description' });
    }

    if (!manifest.author || typeof manifest.author !== 'string') {
      warnings.push({ code: 'MISSING_AUTHOR', message: 'Plugin missing author', field: 'author' });
    }

    if (manifest.permissions && Array.isArray(manifest.permissions)) {
      for (const perm of manifest.permissions) {
        if (typeof perm !== 'string' || !['read-files', 'write-files', 'network', 'clipboard', 'system-info', 'crypto', 'ui', 'storage'].includes(perm)) {
          errors.push({ code: 'INVALID_PERMISSION', message: `Unknown permission: ${perm}`, severity: 'error', field: 'permissions' });
        }
      }
    }

    if (manifest.size && typeof manifest.size === 'number' && (manifest.size as number) > this.limits.maxPluginSize) {
      errors.push({
        code: 'PLUGIN_TOO_LARGE',
        message: `Plugin exceeds maximum size of ${this.formatSize(this.limits.maxPluginSize)}`,
        severity: 'error',
        field: 'size'
      });
    }

    return { valid: errors.length === 0, errors, warnings, suggestions };
  }

  validateConfiguration(config: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push({ code: 'INVALID_CONFIG', message: 'Configuration must be an object', severity: 'error' });
      return { valid: false, errors, warnings, suggestions };
    }

    const configStr = JSON.stringify(config);
    if (configStr.length > this.limits.maxConfigSize) {
      errors.push({
        code: 'CONFIG_TOO_LARGE',
        message: `Configuration exceeds maximum size of ${this.formatSize(this.limits.maxConfigSize)}`,
        severity: 'error'
      });
    }

    if (config.version && typeof config.version === 'string') {
      if (!/^\d+\.\d+\.\d+$/.test(config.version as string)) {
        warnings.push({ code: 'INVALID_CONFIG_VERSION', message: 'Configuration version format is unusual', suggestion: 'Use semver format' });
      }
    }

    if (config.theme && typeof config.theme === 'string') {
      const validThemes = ['dark', 'light', 'high-contrast', 'cyber-green', 'midnight-blue', 'professional-gray', 'color-blind-friendly'];
      if (!validThemes.includes(config.theme as string)) {
        warnings.push({ code: 'UNKNOWN_THEME', message: `Unknown theme: ${config.theme}`, suggestion: `Valid themes: ${validThemes.join(', ')}` });
      }
    }

    return { valid: errors.length === 0, errors, warnings, suggestions };
  }

  validateTheme(theme: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    if (!theme.id || typeof theme.id !== 'string') {
      errors.push({ code: 'MISSING_THEME_ID', message: 'Theme must have an id', severity: 'error', field: 'id' });
    }

    if (!theme.name || typeof theme.name !== 'string') {
      errors.push({ code: 'MISSING_THEME_NAME', message: 'Theme must have a name', severity: 'error', field: 'name' });
    }

    if (!theme.colors || typeof theme.colors !== 'object') {
      errors.push({ code: 'MISSING_COLORS', message: 'Theme must define colors', severity: 'error', field: 'colors' });
    } else {
      const colors = theme.colors as Record<string, string>;
      const requiredColors = ['primary', 'secondary', 'background', 'surface', 'text', 'border'];
      for (const key of requiredColors) {
        if (!colors[key]) {
          errors.push({ code: 'MISSING_COLOR', message: `Theme missing required color: ${key}`, severity: 'error', field: `colors.${key}` });
        } else if (!/^#[0-9a-fA-F]{3,8}$/.test(colors[key])) {
          errors.push({ code: 'INVALID_COLOR', message: `Invalid color format for ${key}: ${colors[key]}`, severity: 'error', field: `colors.${key}` });
        }
      }

      if (colors.background && colors.text) {
        const bgLum = this.relativeLuminance(colors.background);
        const textLum = this.relativeLuminance(colors.text);
        const contrast = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);
        if (contrast < 4.5) {
          warnings.push({
            code: 'LOW_CONTRAST',
            message: `Text/background contrast ratio is ${contrast.toFixed(1)}:1 (minimum recommended: 4.5:1)`,
            suggestion: 'Increase contrast for accessibility'
          });
        }
      }
    }

    const configStr = JSON.stringify(theme);
    if (configStr.length > this.limits.maxThemeSize) {
      errors.push({
        code: 'THEME_TOO_LARGE',
        message: `Theme exceeds maximum size of ${this.formatSize(this.limits.maxThemeSize)}`,
        severity: 'error'
      });
    }

    return { valid: errors.length === 0, errors, warnings, suggestions };
  }

  validateLanguagePack(pack: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    if (!pack || typeof pack !== 'object') {
      errors.push({ code: 'INVALID_PACK', message: 'Language pack must be an object', severity: 'error' });
      return { valid: false, errors, warnings, suggestions };
    }

    if (!pack.code || typeof pack.code !== 'string') {
      errors.push({ code: 'MISSING_CODE', message: 'Language pack must have a language code', severity: 'error', field: 'code' });
    }

    if (!pack.name || typeof pack.name !== 'string') {
      warnings.push({ code: 'MISSING_NAME', message: 'Language pack missing display name', field: 'name' });
    }

    if (!pack.translations || typeof pack.translations !== 'object') {
      errors.push({ code: 'MISSING_TRANSLATIONS', message: 'Language pack missing translations', severity: 'error', field: 'translations' });
    }

    const packStr = JSON.stringify(pack);
    if (packStr.length > this.limits.maxLanguagePackSize) {
      errors.push({
        code: 'PACK_TOO_LARGE',
        message: `Language pack exceeds maximum size of ${this.formatSize(this.limits.maxLanguagePackSize)}`,
        severity: 'error'
      });
    }

    return { valid: errors.length === 0, errors, warnings, suggestions };
  }

  validateExportLocation(path: string): ValidationResult {
    return this.validateFilePath(path);
  }

  validateClipboardContent(text: string): ValidationResult {
    const result = this.validateText(text, 'clipboard');
    if (text.length > 100000) {
      result.warnings.push({
        code: 'LARGE_CLIPBOARD',
        message: 'Very large clipboard content',
        suggestion: 'Consider using file import instead'
      });
    }
    return result;
  }

  validateBatchJob(job: { items: unknown[]; maxBatchSize?: number }): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    const limit = job.maxBatchSize || this.limits.maxBatchSize;
    if (job.items.length === 0) {
      warnings.push({ code: 'EMPTY_BATCH', message: 'Batch has no items to process' });
    }
    if (job.items.length > limit) {
      errors.push({
        code: 'BATCH_TOO_LARGE',
        message: `Batch size (${job.items.length}) exceeds limit (${limit})`,
        severity: 'error'
      });
    }
    if (job.items.length > 100) {
      suggestions.push('Large batch operations may take a while. Consider cancelling if needed.');
    }

    return { valid: errors.length === 0, errors, warnings, suggestions };
  }

  validateWorkspace(data: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    if (!data.version || typeof data.version !== 'string') {
      errors.push({ code: 'MISSING_VERSION', message: 'Workspace missing version', severity: 'error', field: 'version' });
    }

    if (!data.id || typeof data.id !== 'string') {
      errors.push({ code: 'MISSING_ID', message: 'Workspace missing id', severity: 'error', field: 'id' });
    }

    if (!data.name || typeof data.name !== 'string') {
      warnings.push({ code: 'MISSING_NAME', message: 'Workspace missing name', field: 'name' });
    }

    const configStr = JSON.stringify(data);
    if (configStr.length > this.limits.maxWorkspaceSize) {
      errors.push({
        code: 'WORKSPACE_TOO_LARGE',
        message: `Workspace exceeds maximum size of ${this.formatSize(this.limits.maxWorkspaceSize)}`,
        severity: 'error'
      });
    }

    return { valid: errors.length === 0, errors, warnings, suggestions };
  }

  private relativeLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  }

  mergeResults(results: ValidationResult[]): ValidationResult {
    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);
    const allSuggestions = results.flatMap(r => r.suggestions);
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: [...new Set(allSuggestions)]
    };
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }

  getLimits(): InputLimits {
    return { ...this.limits };
  }

  updateLimits(updates: Partial<InputLimits>): void {
    this.limits = { ...this.limits, ...updates };
  }
}

export const inputValidator = new InputValidator();
