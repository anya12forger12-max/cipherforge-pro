export interface IntegrityCheck {
  id: string;
  name: string;
  target: string;
  expectedChecksum: string;
  actualChecksum: string;
  isValid: boolean;
  checkedAt: Date;
  algorithm: 'SHA-256' | 'SHA-512';
}

export interface IntegrityReport {
  id: string;
  timestamp: Date;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  checks: IntegrityCheck[];
  overallValid: boolean;
}

export interface FileChecksum {
  path: string;
  sha256: string;
  sha512?: string;
  size: number;
  lastModified: Date;
}

export class IntegrityVerifier {
  private checks: Map<string, IntegrityCheck> = new Map();
  private checksums: Map<string, FileChecksum> = new Map();

  async generateChecksum(data: string, algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifyChecksum(data: string, expectedChecksum: string, algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<IntegrityCheck> {
    const actualChecksum = await this.generateChecksum(data, algorithm);
    
    const check: IntegrityCheck = {
      id: crypto.randomUUID(),
      name: `Checksum verification`,
      target: 'data',
      expectedChecksum,
      actualChecksum,
      isValid: actualChecksum === expectedChecksum,
      checkedAt: new Date(),
      algorithm
    };

    this.checks.set(check.id, check);
    return check;
  }

  async verifyFileChecksum(file: File, expectedChecksum: string): Promise<IntegrityCheck> {
    const data = await this.readFileContent(file);
    const check = await this.verifyChecksum(data, expectedChecksum);
    check.name = `File checksum: ${file.name}`;
    check.target = file.name;
    return check;
  }

  async storeChecksum(path: string, data: string): Promise<FileChecksum> {
    const sha256 = await this.generateChecksum(data, 'SHA-256');
    const sha512 = await this.generateChecksum(data, 'SHA-512');
    
    const checksum: FileChecksum = {
      path,
      sha256,
      sha512,
      size: new Blob([data]).size,
      lastModified: new Date()
    };

    this.checksums.set(path, checksum);
    return checksum;
  }

  async verifyStoredChecksum(path: string, data: string): Promise<boolean> {
    const stored = this.checksums.get(path);
    if (!stored) return false;

    const currentChecksum = await this.generateChecksum(data);
    return currentChecksum === stored.sha256;
  }

  getStoredChecksum(path: string): FileChecksum | undefined {
    return this.checksums.get(path);
  }

  getAllChecksums(): FileChecksum[] {
    return Array.from(this.checksums.values());
  }

  compareChecksums(path1: string, path2: string): { identical: boolean; details: string } {
    const checksum1 = this.checksums.get(path1);
    const checksum2 = this.checksums.get(path2);

    if (!checksum1 || !checksum2) {
      return { identical: false, details: 'One or both checksums not found' };
    }

    return {
      identical: checksum1.sha256 === checksum2.sha256,
      details: checksum1.sha256 === checksum2.sha256 
        ? 'Files are identical' 
        : 'Files differ'
    };
  }

  generateReport(): IntegrityReport {
    const checks = Array.from(this.checks.values());
    const passedChecks = checks.filter(c => c.isValid).length;
    const failedChecks = checks.filter(c => !c.isValid).length;

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      totalChecks: checks.length,
      passedChecks,
      failedChecks,
      checks,
      overallValid: failedChecks === 0
    };
  }

  clearChecks(): void {
    this.checks.clear();
  }

  clearChecksums(): void {
    this.checksums.clear();
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export const integrityVerifier = new IntegrityVerifier();
