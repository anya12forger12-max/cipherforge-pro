export interface FileMetadata {
  id: string;
  name: string;
  extension: string;
  size: number;
  type: string;
  encoding: string;
  lastModified: Date;
  createdAt: Date;
  checksum: {
    sha256: string;
    sha512?: string;
  };
  stats: {
    characterCount: number;
    wordCount: number;
    lineCount: number;
    paragraphCount: number;
  };
  permissions?: string;
  path: string;
}

export interface ProcessedFile {
  metadata: FileMetadata;
  content: string;
  originalContent: string;
  isModified: boolean;
  processingHistory: FileOperation[];
}

export interface FileOperation {
  id: string;
  type: 'import' | 'export' | 'encrypt' | 'decrypt' | 'analyze' | 'transform';
  timestamp: Date;
  inputFormat: string;
  outputFormat: string;
  status: 'success' | 'error' | 'pending';
  duration: number;
  details?: string;
}

export interface ImportOptions {
  format: 'txt' | 'csv' | 'json' | 'xml' | 'html' | 'md' | 'log' | 'code' | 'auto';
  encoding: string;
  validateContent: boolean;
  createBackup: boolean;
}

export interface ExportOptions {
  format: 'txt' | 'csv' | 'json' | 'md' | 'html' | 'pdf' | 'png' | 'svg';
  includeMetadata: boolean;
  includeAnalysis: boolean;
  includeCharts: boolean;
  preserveFormatting: boolean;
  template?: string;
}

export interface BatchProcessJob {
  id: string;
  files: ProcessedFile[];
  operation: 'encrypt' | 'decrypt' | 'analyze' | 'export';
  options: Record<string, unknown>;
  status: 'queued' | 'processing' | 'paused' | 'completed' | 'error' | 'cancelled';
  progress: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
  startTime?: Date;
  endTime?: Date;
  errors: BatchError[];
}

export interface BatchError {
  fileId: string;
  fileName: string;
  error: string;
  timestamp: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  line: number;
  message: string;
  suggestion: string;
}

export interface DragDropConfig {
  acceptedTypes: string[];
  maxFileSize: number;
  multiple: boolean;
  onDrop: (files: File[]) => void;
  onDragOver?: (e: DragEvent) => void;
  onDragLeave?: (e: DragEvent) => void;
}

export interface FileWatchConfig {
  enabled: boolean;
  interval: number;
  paths: string[];
  onFileChanged: (path: string) => void;
  onFileCreated: (path: string) => void;
  onFileDeleted: (path: string) => void;
}

export type SupportedFileType = 
  | 'txt' | 'csv' | 'json' | 'xml' | 'html' | 'md' 
  | 'log' | 'py' | 'cpp' | 'java' | 'js' | 'ts' | 'cs';

export const SUPPORTED_EXTENSIONS: SupportedFileType[] = [
  'txt', 'csv', 'json', 'xml', 'html', 'md',
  'log', 'py', 'cpp', 'java', 'js', 'ts', 'cs'
];

export const FILE_TYPE_MAP: Record<string, string> = {
  'txt': 'text/plain',
  'csv': 'text/csv',
  'json': 'application/json',
  'xml': 'application/xml',
  'html': 'text/html',
  'md': 'text/markdown',
  'log': 'text/plain',
  'py': 'text/x-python',
  'cpp': 'text/x-c++',
  'java': 'text/x-java',
  'js': 'text/javascript',
  'ts': 'text/typescript',
  'cs': 'text/x-csharp'
};
