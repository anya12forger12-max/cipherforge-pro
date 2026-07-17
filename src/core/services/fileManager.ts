import { 
  type FileMetadata, 
  type ProcessedFile, 
  type ImportOptions, 
  type ExportOptions,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type BatchProcessJob,
  FILE_TYPE_MAP
} from '../types/files';

export class FileManager {
  private files: Map<string, ProcessedFile> = new Map();
  private batchJobs: Map<string, BatchProcessJob> = new Map();

  async importFile(file: File, options: ImportOptions): Promise<ProcessedFile> {
    const content = await this.readFileContent(file);
    const metadata = await this.extractMetadata(file, content);
    
    const processedFile: ProcessedFile = {
      metadata,
      content,
      originalContent: content,
      isModified: false,
      processingHistory: []
    };

    if (options.validateContent) {
      const validation = this.validateFile(processedFile);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }

    this.files.set(metadata.id, processedFile);
    return processedFile;
  }

  async importMultipleFiles(files: File[], options: ImportOptions): Promise<ProcessedFile[]> {
    const results: ProcessedFile[] = [];
    for (const file of files) {
      try {
        const processed = await this.importFile(file, options);
        results.push(processed);
      } catch (error) {
        console.error(`Failed to import ${file.name}:`, error);
      }
    }
    return results;
  }

  async importFromClipboard(clipboardData: string, filename: string = 'clipboard.txt'): Promise<ProcessedFile> {
    const metadata = this.createMetadataFromContent(filename, clipboardData);
    
    const processedFile: ProcessedFile = {
      metadata,
      content: clipboardData,
      originalContent: clipboardData,
      isModified: false,
      processingHistory: []
    };

    this.files.set(metadata.id, processedFile);
    return processedFile;
  }

  exportFile(fileId: string, options: ExportOptions): Blob {
    const file = this.files.get(fileId);
    if (!file) {
      throw new Error(`File not found: ${fileId}`);
    }

    let content = file.content;

    if (options.includeMetadata) {
      content = this.addMetadataToContent(content, file.metadata);
    }

    const mimeType = this.getMimeType(options.format);
    return new Blob([content], { type: mimeType });
  }

  exportAsText(fileId: string): string {
    const file = this.files.get(fileId);
    if (!file) throw new Error(`File not found: ${fileId}`);
    return file.content;
  }

  exportAsJSON(fileId: string): string {
    const file = this.files.get(fileId);
    if (!file) throw new Error(`File not found: ${fileId}`);
    
    return JSON.stringify({
      metadata: file.metadata,
      content: file.content,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  exportAsHTML(fileId: string): string {
    const file = this.files.get(fileId);
    if (!file) throw new Error(`File not found: ${fileId}`);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${file.metadata.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; }
    .metadata { background: #e3f2fd; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="metadata">
    <strong>File:</strong> ${file.metadata.name}<br>
    <strong>Size:</strong> ${this.formatFileSize(file.metadata.size)}<br>
    <strong>Characters:</strong> ${file.metadata.stats.characterCount}
  </div>
  <pre>${this.escapeHtml(file.content)}</pre>
</body>
</html>`;
  }

  exportAsMarkdown(fileId: string): string {
    const file = this.files.get(fileId);
    if (!file) throw new Error(`File not found: ${fileId}`);
    
    return `# ${file.metadata.name}

**File Information:**
- Size: ${this.formatFileSize(file.metadata.size)}
- Characters: ${file.metadata.stats.characterCount}
- Words: ${file.metadata.stats.wordCount}
- Lines: ${file.metadata.stats.lineCount}

---

\`\`\`
${file.content}
\`\`\`

---
*Exported from CipherForge Pro on ${new Date().toLocaleString()}*
`;
  }

  validateFile(file: ProcessedFile): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    const lines = file.content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.length > 1000) {
        warnings.push({
          line: index + 1,
          message: 'Line exceeds 1000 characters',
          suggestion: 'Consider breaking long lines for better readability'
        });
      }

      if (line.includes('\t') && line.includes('  ')) {
        warnings.push({
          line: index + 1,
          message: 'Mixed tabs and spaces detected',
          suggestion: 'Use consistent indentation'
        });
      }
    });

    if (file.metadata.size > 10 * 1024 * 1024) {
      suggestions.push('File is larger than 10MB. Consider processing in chunks for better performance.');
    }

    if (file.metadata.stats.characterCount === 0) {
      errors.push({
        line: 0,
        column: 0,
        message: 'File is empty',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  getFileMetadata(fileId: string): FileMetadata | undefined {
    return this.files.get(fileId)?.metadata;
  }

  getAllFiles(): FileMetadata[] {
    return Array.from(this.files.values()).map(f => f.metadata);
  }

  deleteFile(fileId: string): boolean {
    return this.files.delete(fileId);
  }

  updateFileContent(fileId: string, content: string): void {
    const file = this.files.get(fileId);
    if (file) {
      file.content = content;
      file.isModified = content !== file.originalContent;
      file.metadata.stats = this.calculateStats(content);
    }
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private async extractMetadata(file: File, content: string): Promise<FileMetadata> {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const stats = this.calculateStats(content);
    const checksum = await this.calculateChecksum(content);

    return {
      id: crypto.randomUUID(),
      name: file.name,
      extension,
      size: file.size,
      type: FILE_TYPE_MAP[extension] || 'text/plain',
      encoding: 'UTF-8',
      lastModified: new Date(file.lastModified),
      createdAt: new Date(),
      checksum,
      stats,
      path: file.name
    };
  }

  private createMetadataFromContent(filename: string, content: string): FileMetadata {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const stats = this.calculateStats(content);

    return {
      id: crypto.randomUUID(),
      name: filename,
      extension,
      size: new Blob([content]).size,
      type: FILE_TYPE_MAP[extension] || 'text/plain',
      encoding: 'UTF-8',
      lastModified: new Date(),
      createdAt: new Date(),
      checksum: { sha256: '' },
      stats,
      path: filename
    };
  }

  private calculateStats(content: string): FileMetadata['stats'] {
    const lines = content.split('\n');
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    return {
      characterCount: content.length,
      wordCount: words.length,
      lineCount: lines.length,
      paragraphCount: paragraphs.length
    };
  }

  private async calculateChecksum(content: string): Promise<{ sha256: string; sha512?: string }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return { sha256 };
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'csv': 'text/csv',
      'json': 'application/json',
      'md': 'text/markdown',
      'html': 'text/html',
      'pdf': 'application/pdf',
      'png': 'image/png',
      'svg': 'image/svg+xml'
    };
    return mimeTypes[format] || 'text/plain';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  private addMetadataToContent(content: string, metadata: FileMetadata): string {
    const header = `---
filename: ${metadata.name}
size: ${metadata.size}
characters: ${metadata.stats.characterCount}
words: ${metadata.stats.wordCount}
lines: ${metadata.stats.lineCount}
exported: ${new Date().toISOString()}
---

`;
    return header + content;
  }

  async createBatchJob(files: ProcessedFile[], operation: BatchProcessJob['operation'], options: Record<string, unknown>): Promise<BatchProcessJob> {
    const job: BatchProcessJob = {
      id: crypto.randomUUID(),
      files,
      operation,
      options,
      status: 'queued',
      progress: {
        total: files.length,
        completed: 0,
        failed: 0,
        percentage: 0
      },
      errors: []
    };

    this.batchJobs.set(job.id, job);
    return job;
  }

  async processBatchJob(jobId: string, onProgress?: (progress: BatchProcessJob['progress']) => void): Promise<BatchProcessJob> {
    const job = this.batchJobs.get(jobId);
    if (!job) throw new Error(`Batch job not found: ${jobId}`);

    job.status = 'processing';
    job.startTime = new Date();

    for (let i = 0; i < job.files.length; i++) {
      if (job.status as string === 'cancelled') break;
      
      while (job.status as string === 'paused') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      try {
        switch (job.operation) {
          case 'encrypt':
            // Encryption logic
            break;
          case 'decrypt':
            // Decryption logic
            break;
          case 'analyze':
            // Analysis logic
            break;
          case 'export':
            // Export logic
            break;
        }

        job.progress.completed++;
      } catch (error) {
        job.progress.failed++;
        job.errors.push({
          fileId: job.files[i].metadata.id,
          fileName: job.files[i].metadata.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }

      job.progress.percentage = Math.round((job.progress.completed / job.progress.total) * 100);
      onProgress?.(job.progress);
    }

    job.status = job.progress.failed === job.files.length ? 'error' : 'completed';
    job.endTime = new Date();

    return job;
  }

  pauseBatchJob(jobId: string): void {
    const job = this.batchJobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'paused';
    }
  }

  resumeBatchJob(jobId: string): void {
    const job = this.batchJobs.get(jobId);
    if (job && job.status === 'paused') {
      job.status = 'processing';
    }
  }

  cancelBatchJob(jobId: string): void {
    const job = this.batchJobs.get(jobId);
    if (job) {
      job.status = 'cancelled';
    }
  }

  getBatchJob(jobId: string): BatchProcessJob | undefined {
    return this.batchJobs.get(jobId);
  }

  getAllBatchJobs(): BatchProcessJob[] {
    return Array.from(this.batchJobs.values());
  }
}

export const fileManager = new FileManager();
