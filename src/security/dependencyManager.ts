import { loggingSystem } from './loggingSystem';

export interface DependencyInfo {
  name: string;
  version: string;
  license: string;
  repository?: string;
  description?: string;
  author?: string;
  checksum?: string;
  isDevDependency: boolean;
  used: boolean;
  size?: number;
}

export interface AuditResult {
  timestamp: Date;
  totalDependencies: number;
  productionDependencies: number;
  devDependencies: number;
  unusedDependencies: string[];
  licenseDistribution: Record<string, number>;
  licenseIssues: LicenseIssue[];
  securityNotes: string[];
  sbom: string;
  score: number;
}

export interface LicenseIssue {
  dependency: string;
  license: string;
  issue: string;
  severity: 'info' | 'warning' | 'critical';
}

const LICENSE_RISK: Record<string, 'safe' | 'moderate' | 'restrictive' | 'unknown'> = {
  'MIT': 'safe',
  'ISC': 'safe',
  'BSD-2-Clause': 'safe',
  'BSD-3-Clause': 'safe',
  'Apache-2.0': 'safe',
  '0BSD': 'safe',
  'Unlicense': 'safe',
  'BlueOak-1.0.0': 'safe',
  'LGPL-2.1': 'moderate',
  'LGPL-3.0': 'moderate',
  'MPL-2.0': 'moderate',
  'LGPL-2.1-only': 'moderate',
  'GPL-2.0': 'restrictive',
  'GPL-3.0': 'restrictive',
  'AGPL-3.0': 'restrictive',
  'CC0-1.0': 'safe',
  'CC-BY-4.0': 'moderate',
  'CC-BY-SA-4.0': 'moderate',
  'WTFPL': 'safe',
  'Zlib': 'safe',
  'Python-2.0': 'safe',
};

const EXPECTED_DEPENDENCIES: Record<string, { purpose: string; devOnly: boolean }> = {
  'react': { purpose: 'UI framework', devOnly: false },
  'react-dom': { purpose: 'React DOM renderer', devOnly: false },
  'zustand': { purpose: 'State management', devOnly: false },
  'lucide-react': { purpose: 'Icon library', devOnly: false },
  'recharts': { purpose: 'Charting library', devOnly: false },
  'vite': { purpose: 'Build tool', devOnly: true },
  'typescript': { purpose: 'Type system', devOnly: true },
  '@types/react': { purpose: 'React type definitions', devOnly: true },
  '@types/react-dom': { purpose: 'React DOM types', devOnly: true },
  '@types/node': { purpose: 'Node.js types', devOnly: true },
};

export class DependencyManager {
  private dependencies: Map<string, DependencyInfo> = new Map();

  constructor() {
    this.loadPackageInfo();
  }

  private loadPackageInfo(): void {
    try {
      const pkgJson = document.querySelector('script[data-package]')?.textContent;
      if (pkgJson) {
        const pkg = JSON.parse(pkgJson);
        this.parsePackageJson(pkg);
      }
    } catch {
      this.loadFromEmbeddedData();
    }
  }

  private loadFromEmbeddedData(): void {
    const deps: Array<[string, DependencyInfo]> = [
      ['react', { name: 'react', version: '19.1.0', license: 'MIT', description: 'UI framework', author: 'Meta', isDevDependency: false, used: true }],
      ['react-dom', { name: 'react-dom', version: '19.1.0', license: 'MIT', description: 'React DOM renderer', author: 'Meta', isDevDependency: false, used: true }],
      ['zustand', { name: 'zustand', version: '5.0.5', license: 'MIT', description: 'State management', author: 'Daishi Kato', isDevDependency: false, used: true }],
      ['lucide-react', { name: 'lucide-react', version: '0.488.0', license: 'ISC', description: 'Icon library', author: 'Lucide', isDevDependency: false, used: true }],
      ['recharts', { name: 'recharts', version: '2.15.3', license: 'MIT', description: 'Charting library', author: 'Recharts', isDevDependency: false, used: true }],
      ['vite', { name: 'vite', version: '6.4.3', license: 'MIT', description: 'Build tool', author: 'Evan You', isDevDependency: true, used: true }],
      ['typescript', { name: 'typescript', version: '5.8.3', license: 'Apache-2.0', description: 'Type system', author: 'Microsoft', isDevDependency: true, used: true }],
      ['@types/react', { name: '@types/react', version: '19.1.8', license: 'MIT', description: 'React type definitions', isDevDependency: true, used: true }],
      ['@types/react-dom', { name: '@types/react-dom', version: '19.1.6', license: 'MIT', description: 'React DOM types', isDevDependency: true, used: true }],
      ['@types/node', { name: '@types/node', version: '22.16.5', license: 'MIT', description: 'Node.js types', isDevDependency: true, used: true }],
    ];
    deps.forEach(([name, info]) => this.dependencies.set(name, info));
  }

  private parsePackageJson(pkg: Record<string, unknown>): void {
    const deps = (pkg.dependencies || {}) as Record<string, string>;
    const devDeps = (pkg.devDependencies || {}) as Record<string, string>;
    Object.entries(deps).forEach(([name, version]) => {
      this.dependencies.set(name, {
        name,
        version: version.replace(/^[\^~>=<]*/, ''),
        license: 'MIT',
        isDevDependency: false,
        used: true,
        description: EXPECTED_DEPENDENCIES[name]?.purpose
      });
    });

    Object.entries(devDeps).forEach(([name, version]) => {
      this.dependencies.set(name, {
        name,
        version: version.replace(/^[\^~>=<]*/, ''),
        license: 'MIT',
        isDevDependency: true,
        used: true,
        description: EXPECTED_DEPENDENCIES[name]?.purpose
      });
    });
  }

  getDependencies(): DependencyInfo[] {
    return Array.from(this.dependencies.values());
  }

  getProductionDependencies(): DependencyInfo[] {
    return this.getDependencies().filter(d => !d.isDevDependency);
  }

  getDevDependencies(): DependencyInfo[] {
    return this.getDependencies().filter(d => d.isDevDependency);
  }

  getDependency(name: string): DependencyInfo | undefined {
    return this.dependencies.get(name);
  }

  async runAudit(): Promise<AuditResult> {
    const deps = this.getDependencies();
    const licenseDistribution: Record<string, number> = {};
    const licenseIssues: LicenseIssue[] = [];
    const securityNotes: string[] = [];

    for (const dep of deps) {
      licenseDistribution[dep.license] = (licenseDistribution[dep.license] || 0) + 1;

      const risk = LICENSE_RISK[dep.license] || 'unknown';
      if (risk === 'restrictive') {
        licenseIssues.push({
          dependency: dep.name,
          license: dep.license,
          issue: 'Copyleft license may require source code disclosure',
          severity: 'critical'
        });
      } else if (risk === 'moderate') {
        licenseIssues.push({
          dependency: dep.name,
          license: dep.license,
          issue: 'Weak copyleft license has some redistribution requirements',
          severity: 'warning'
        });
      } else if (risk === 'unknown') {
        licenseIssues.push({
          dependency: dep.name,
          license: dep.license,
          issue: 'License not recognized in risk database',
          severity: 'info'
        });
      }

      if (!dep.used) {
        securityNotes.push(`Unused dependency "${dep.name}" could be removed to reduce attack surface`);
      }
    }

    const unused = this.findUnusedDependencies();

    const score = this.calculateScore(deps, licenseIssues, unused);

    const sbom = this.generateSBOM(deps);

    const prodCount = deps.filter(d => !d.isDevDependency).length;
    const devCount = deps.filter(d => d.isDevDependency).length;

    const result: AuditResult = {
      timestamp: new Date(),
      totalDependencies: deps.length,
      productionDependencies: prodCount,
      devDependencies: devCount,
      unusedDependencies: unused,
      licenseDistribution,
      licenseIssues,
      securityNotes,
      sbom,
      score
    };

    loggingSystem.info('DependencyManager', 'Audit completed', { score, total: deps.length, licenseIssues: licenseIssues.length });
    return result;
  }

  private findUnusedDependencies(): string[] {
    const unused: string[] = [];
    for (const [name, info] of this.dependencies) {
      if (!info.used && !info.isDevDependency) {
        unused.push(name);
      }
    }
    return unused;
  }

  private calculateScore(deps: DependencyInfo[], licenseIssues: LicenseIssue[], unused: string[]): number {
    let score = 100;
    score -= licenseIssues.filter(i => i.severity === 'critical').length * 15;
    score -= licenseIssues.filter(i => i.severity === 'warning').length * 5;
    score -= licenseIssues.filter(i => i.severity === 'info').length * 1;
    score -= unused.length * 3;
    score -= Math.max(0, deps.length - 20) * 0.5;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateSBOM(deps?: DependencyInfo[]): string {
    const depList = deps || this.getDependencies();
    const sbom = {
      format: 'CycloneDX',
      version: '1.5',
      metadata: {
        tool: { name: 'CipherForge Pro', version: '1.0.0' },
        timestamp: new Date().toISOString()
      },
      components: depList.map(d => ({
        type: 'library',
        name: d.name,
        version: d.version,
        license: { id: d.license },
        description: d.description,
        author: d.author,
        scope: d.isDevDependency ? 'dev' : 'required'
      }))
    };
    return JSON.stringify(sbom, null, 2);
  }

  getLicenseRisk(license: string): 'safe' | 'moderate' | 'restrictive' | 'unknown' {
    return LICENSE_RISK[license] || 'unknown';
  }

  getSummary(): {
    total: number;
    production: number;
    dev: number;
    safeLicenses: number;
    moderateLicenses: number;
    restrictiveLicenses: number;
    unknownLicenses: number;
  } {
    const deps = this.getDependencies();
    let safe = 0, moderate = 0, restrictive = 0, unknown = 0;
    for (const dep of deps) {
      const risk = this.getLicenseRisk(dep.license);
      if (risk === 'safe') safe++;
      else if (risk === 'moderate') moderate++;
      else if (risk === 'restrictive') restrictive++;
      else unknown++;
    }
    return {
      total: deps.length,
      production: deps.filter(d => !d.isDevDependency).length,
      dev: deps.filter(d => d.isDevDependency).length,
      safeLicenses: safe,
      moderateLicenses: moderate,
      restrictiveLicenses: restrictive,
      unknownLicenses: unknown
    };
  }
}

export const dependencyManager = new DependencyManager();
