import type { CipherModule, CipherResult, CipherParameter, BruteForceOptions, CipherAnalysisResult } from './cipherEngine';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function normalizeText(text: string, keepCase = false): string {
  const normalized = text.replace(/[^A-Za-z]/g, '');
  return keepCase ? normalized : normalized.toUpperCase();
}

function shiftChar(char: string, shift: number, alphabet: string): string {
  const idx = alphabet.indexOf(char);
  if (idx === -1) return char;
  return alphabet[(idx + shift + alphabet.length) % alphabet.length];
}

function vigenereProcess(text: string, key: string, mode: 'encrypt' | 'decrypt'): string {
  const upperKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (upperKey.length === 0) return text;

  let keyIdx = 0;
  return text.split('').map(char => {
    if (!/[A-Za-z]/.test(char)) return char;
    const normalizedChar = char.toUpperCase();
    const shift = ALPHABET.indexOf(upperKey[keyIdx % upperKey.length]);
    const actualShift = mode === 'encrypt' ? shift : -shift;
    const result = shiftChar(normalizedChar, actualShift, ALPHABET);
    keyIdx++;
    return char === char.toUpperCase() ? result : result.toLowerCase();
  }).join('');
}

function chiSquaredScore(text: string): number {
  const normalized = text.toUpperCase().replace(/[^A-Z]/g, '');
  if (normalized.length === 0) return 0;

  const englishFreq: Record<string, number> = {
    A: 0.0817, B: 0.0150, C: 0.0278, D: 0.0425, E: 0.1270, F: 0.0223,
    G: 0.0202, H: 0.0609, I: 0.0697, J: 0.0015, K: 0.0077, L: 0.0403,
    M: 0.0241, N: 0.0675, O: 0.0751, P: 0.0193, Q: 0.0010, R: 0.0599,
    S: 0.0633, T: 0.0906, U: 0.0276, V: 0.0098, W: 0.0236, X: 0.0015,
    Y: 0.0197, Z: 0.0007
  };

  let chiSq = 0;
  for (const letter of ALPHABET) {
    const observed = normalized.split('').filter(c => c === letter).length / normalized.length;
    const expected = englishFreq[letter] || 0;
    if (expected > 0) {
      chiSq += Math.pow(observed - expected, 2) / expected;
    }
  }
  return chiSq;
}

export class VigenereCipher implements CipherModule {
  readonly id = 'vigenere';
  readonly name = 'Vigenère Cipher';
  readonly description = 'A polyalphabetic substitution cipher using a keyword to shift each letter by a different amount. More secure than Caesar but still breakable with modern cryptanalysis.';
  readonly category = 'polyalphabetic' as const;
  readonly version = '1.0.0';
  readonly author = 'CipherForge Pro';
  readonly isSecure = false;
  readonly securityDisclaimer = 'The Vigenère Cipher is historically significant but NOT secure for real-world use. It is vulnerable to Kasiski examination, frequency analysis, and other modern cryptanalysis techniques.';
  readonly supportedAlphabets = ['latin'];
  readonly documentationUrl = 'https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher';

  readonly parameters: CipherParameter[] = [
    {
      name: 'key',
      label: 'Keyword',
      type: 'string',
      required: true,
      description: 'The keyword used for encryption/decryption',
      placeholder: 'Enter a keyword (e.g., SECRET)'
    }
  ];

  encrypt(input: string, params: Record<string, unknown>): CipherResult {
    const startTime = performance.now();
    const key = String(params.key || '');

    if (!key || key.length === 0) {
      return {
        input,
        output: '',
        algorithm: this.id,
        key,
        direction: 'encrypt',
        confidence: 0,
        duration: 0,
        timestamp: new Date(),
        educationalNote: 'A keyword is required for Vigenère encryption.'
      };
    }

    const output = vigenereProcess(input, key, 'encrypt');
    const duration = performance.now() - startTime;

    return {
      input,
      output,
      algorithm: this.id,
      key,
      direction: 'encrypt',
      confidence: 1.0,
      duration,
      timestamp: new Date(),
      educationalNote: 'Each letter is shifted by the corresponding letter in the keyword. The keyword repeats to match the text length.'
    };
  }

  decrypt(input: string, params: Record<string, unknown>): CipherResult {
    const startTime = performance.now();
    const key = String(params.key || '');

    if (!key || key.length === 0) {
      return {
        input,
        output: '',
        algorithm: this.id,
        key,
        direction: 'decrypt',
        confidence: 0,
        duration: 0,
        timestamp: new Date(),
        educationalNote: 'A keyword is required for Vigenère decryption.'
      };
    }

    const output = vigenereProcess(input, key, 'decrypt');
    const duration = performance.now() - startTime;

    return {
      input,
      output,
      algorithm: this.id,
      key,
      direction: 'decrypt',
      confidence: 1.0,
      duration,
      timestamp: new Date(),
      educationalNote: 'Decryption reverses the shift for each letter using the keyword.'
    };
  }

  analyze(input: string): CipherAnalysisResult {
    const normalized = normalizeText(input);
    if (normalized.length < 10) {
      return {
        algorithm: this.id,
        confidence: 0,
        explanation: 'Text too short for reliable Vigenère analysis.',
        alternatives: []
      };
    }

    const keyLengths = this.estimateKeyLength(normalized);
    const alternatives: Array<{ shift: number; score: number; text: string }> = [];

    for (const kl of keyLengths.slice(0, 3)) {
      for (let offset = 0; offset < kl; offset++) {
        const subset = normalized.split('').filter((_, i) => (i - offset) % kl === 0).join('');
        const bestCaesarShift = this.findBestCaesarShift(subset);
        const decrypted = normalizeText(vigenereProcess(input, String.fromCharCode(...Array(kl).fill(0).map((_, i) => i === offset ? bestCaesarShift + 65 : 65)), 'decrypt'));
        alternatives.push({
          shift: bestCaesarShift,
          score: chiSquaredScore(decrypted),
          text: decrypted.substring(0, 100)
        });
      }
    }

    const bestKeyLength = keyLengths[0] || 1;
    const confidence = Math.min(0.9, normalized.length / 200);

    return {
      algorithm: this.id,
      confidence,
      explanation: `Estimated key length: ${bestKeyLength}. The Vigenère cipher uses multiple Caesar shifts determined by the keyword.`,
      alternatives: alternatives.sort((a, b) => a.score - b.score).slice(0, 5)
    };
  }

  bruteForce(input: string, options?: BruteForceOptions): CipherResult[] {
    const maxResults = options?.maxResults || 10;
    const results: CipherResult[] = [];
    const commonKeys = 'SECRETKEYPASSWORDCIPHERENCODEDECODEVISIBLEHIDDENALPHABETFORTYTWO';
    const alphabet = ALPHABET;

    for (let keyLen = 1; keyLen <= Math.min(8, Math.floor(normalizeText(input).length / 3)); keyLen++) {
      for (let i = 0; i < alphabet.length && results.length < maxResults * 2; i++) {
        const key = alphabet[i].repeat(keyLen);
        const result = this.decrypt(input, { key });
        const score = chiSquaredScore(normalizeText(result.output));
        results.push({ ...result, confidence: 1 / (1 + score) });
      }
    }

    for (let i = 0; i < Math.min(commonKeys.length - 4, 20) && results.length < maxResults * 3; i++) {
      for (let keyLen = 2; keyLen <= 6; keyLen++) {
        const key = commonKeys.substring(i, i + keyLen);
        if (key.length === keyLen) {
          const result = this.decrypt(input, { key });
          const score = chiSquaredScore(normalizeText(result.output));
          results.push({ ...result, confidence: 1 / (1 + score) });
        }
      }
    }

    results.sort((a, b) => b.confidence - a.confidence);
    return results.slice(0, maxResults);
  }

  private estimateKeyLength(text: string): number[] {
    const scores: Array<{ length: number; score: number }> = [];

    for (let keyLen = 1; keyLen <= 20; keyLen++) {
      let totalScore = 0;
      let count = 0;
      for (let i = 0; i < keyLen; i++) {
        const subset = text.split('').filter((_, idx) => idx % keyLen === i).join('');
        if (subset.length > 2) {
          totalScore += chiSquaredScore(subset);
          count++;
        }
      }
      scores.push({ length: keyLen, score: count > 0 ? totalScore / count : Infinity });
    }

    return scores.sort((a, b) => a.score - b.score).map(s => s.length);
  }

  private findBestCaesarShift(text: string): number {
    let bestShift = 0;
    let bestScore = Infinity;
    for (let shift = 0; shift < 26; shift++) {
      const decrypted = text.split('').map(c => shiftChar(c, -shift, ALPHABET)).join('');
      const score = chiSquaredScore(decrypted);
      if (score < bestScore) {
        bestScore = score;
        bestShift = shift;
      }
    }
    return bestShift;
  }
}

export const vigenereCipher = new VigenereCipher();
