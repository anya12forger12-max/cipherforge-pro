export interface CipherResult {
  input: string;
  output: string;
  algorithm: string;
  shift?: number;
  key?: string;
  direction: 'encrypt' | 'decrypt';
  confidence: number;
  duration: number;
  timestamp: Date;
  educationalNote?: string;
}

export interface CipherAnalysisResult {
  algorithm: string;
  detectedShift?: number;
  confidence: number;
  explanation: string;
  alternatives: Array<{ shift: number; score: number; text: string }>;
}

export interface CipherModule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: 'substitution' | 'transposition' | 'polyalphabetic' | 'modern-demo' | 'educational';
  readonly version: string;
  readonly author: string;
  readonly isSecure: boolean;
  readonly securityDisclaimer: string;
  readonly supportedAlphabets: string[];
  readonly parameters: CipherParameter[];
  readonly documentationUrl?: string;

  encrypt(input: string, params: Record<string, unknown>): Promise<CipherResult> | CipherResult;
  decrypt(input: string, params: Record<string, unknown>): Promise<CipherResult> | CipherResult;
  analyze?(input: string): Promise<CipherAnalysisResult> | CipherAnalysisResult;
  bruteForce?(input: string, options?: BruteForceOptions): Promise<CipherResult[]> | CipherResult[];
}

export interface CipherParameter {
  name: string;
  label: string;
  type: 'number' | 'string' | 'select' | 'boolean' | 'text';
  required: boolean;
  defaultValue?: unknown;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
  description: string;
  placeholder?: string;
}

export interface BruteForceOptions {
  maxResults?: number;
  minScore?: number;
  languageHint?: string;
  progressCallback?: (progress: number) => void;
}

export interface CipherRegistryEntry {
  module: CipherModule;
  enabled: boolean;
  loadedAt: Date;
  isBuiltIn: boolean;
}
