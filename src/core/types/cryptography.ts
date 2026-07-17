export interface LanguageProfile {
  id: string;
  name: string;
  nativeName: string;
  letterFrequencies: Map<string, number>;
  commonWords: string[];
  bigramFrequencies: Map<string, number>;
  trigramFrequencies: Map<string, number>;
  alphabet: string[];
  wordPatterns: RegExp[];
}

export interface AlphabetConfig {
  id: string;
  name: string;
  characters: string[];
  category: 'latin' | 'greek' | 'cyrillic' | 'numbers' | 'symbols' | 'emoji' | 'custom';
  description: string;
}

export interface AnalysisStep {
  position: number;
  originalChar: string;
  originalPosition: number;
  asciiValue: number;
  unicodeValue: string;
  shiftApplied: number;
  wrapAround: boolean;
  finalChar: string;
  finalPosition: number;
}

export interface BruteForceResult {
  shift: number;
  plaintext: string;
  confidenceScore: number;
  dictionaryMatchPercentage: number;
  englishProbability: number;
  entropy: number;
  characterScore: number;
  wordScore: number;
  ranking: number;
  notes: string[];
  isTopCandidate: boolean;
}

export interface FrequencyAnalysisResult {
  letterFrequency: Map<string, number>;
  bigramFrequency: Map<string, number>;
  trigramFrequency: Map<string, number>;
  quadgramFrequency: Map<string, number>;
  wordFrequency: Map<string, number>;
  entropy: number;
  shannonEntropy: number;
  chiSquareScore: number;
  index_of_coincidence: number;
  spaceFrequency: number;
  punctuationFrequency: number;
  mostCommonChar: string;
  leastCommonChar: string;
  uniqueChars: number;
  totalChars: number;
}

export interface CryptanalysisResult {
  detectedShift: number;
  confidenceScore: number;
  entropy: number;
  readabilityScore: number;
  languageProbability: Map<string, number>;
  dictionaryMatch: number;
  characterStats: FrequencyAnalysisResult;
  recommendedAction: string;
  explanation: string;
  alternativeShifts: number[];
}

export interface StepByStepResult {
  steps: AnalysisStep[];
  totalCharacters: number;
  totalLetters: number;
  totalShifted: number;
  totalPreserved: number;
  processingTime: number;
}
