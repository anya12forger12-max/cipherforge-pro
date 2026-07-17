import type { CipherResult } from '../types';

export class CaesarCipher {
  private static readonly ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly ENGLISH_FREQ = new Map([
    ['A', 0.082], ['B', 0.015], ['C', 0.028], ['D', 0.043],
    ['E', 0.127], ['F', 0.022], ['G', 0.020], ['H', 0.061],
    ['I', 0.070], ['J', 0.002], ['K', 0.008], ['L', 0.040],
    ['M', 0.024], ['N', 0.067], ['O', 0.075], ['P', 0.019],
    ['Q', 0.001], ['R', 0.060], ['S', 0.063], ['T', 0.091],
    ['U', 0.028], ['V', 0.010], ['W', 0.023], ['X', 0.001],
    ['Y', 0.020], ['Z', 0.001]
  ]);

  static encrypt(plaintext: string, shift: number): CipherResult {
    const startTime = performance.now();
    const normalizedShift = ((shift % 26) + 26) % 26;
    
    const ciphertext = plaintext
      .toUpperCase()
      .split('')
      .map(char => {
        if (this.ALPHABET.includes(char)) {
          const index = this.ALPHABET.indexOf(char);
          return this.ALPHABET[(index + normalizedShift) % 26];
        }
        return char;
      })
      .join('');

    return {
      ciphertext,
      plaintext: plaintext.toUpperCase(),
      shift: normalizedShift,
      confidence: 1.0,
      method: 'Caesar Cipher (Shift)',
      timestamp: new Date(),
      duration: performance.now() - startTime
    };
  }

  static decrypt(ciphertext: string, shift: number): CipherResult {
    return this.encrypt(ciphertext, -shift);
  }

  static bruteForce(ciphertext: string): CipherResult[] {
    const results: CipherResult[] = [];
    
    for (let shift = 0; shift < 26; shift++) {
      const result = this.decrypt(ciphertext, shift);
      result.confidence = this.calculateScore(result.plaintext);
      results.push(result);
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  static frequencyAnalysis(ciphertext: string): Map<number, number> {
    const scores = new Map<number, number>();
    const text = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
    
    if (text.length === 0) return scores;

    for (let shift = 0; shift < 26; shift++) {
      const decrypted = this.decrypt(ciphertext, shift).plaintext;
      const score = this.calculateScore(decrypted);
      scores.set(shift, score);
    }

    return scores;
  }

  static calculateIoC(text: string): number {
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    if (cleanText.length < 2) return 0;

    const freq = new Map<string, number>();
    for (const char of cleanText) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }

    let sum = 0;
    for (const count of freq.values()) {
      sum += count * (count - 1);
    }

    const n = cleanText.length;
    return sum / (n * (n - 1));
  }

  private static calculateScore(text: string): number {
    const cleanText = text.replace(/[^A-Z]/g, '');
    if (cleanText.length === 0) return 0;

    const freq = new Map<string, number>();
    for (const char of cleanText) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }

    let chiSquared = 0;
    const n = cleanText.length;

    for (const [letter, expected] of this.ENGLISH_FREQ) {
      const observed = (freq.get(letter) || 0) / n;
      const difference = observed - expected;
      chiSquared += (difference * difference) / expected;
    }

    return 1 / (1 + chiSquared);
  }

  static analyzeText(text: string): {
    letterFrequency: Map<string, number>;
    index_of_coincidence: number;
    entropy: number;
    likelyLanguage: string;
  } {
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    const letterFrequency = new Map<string, number>();
    
    for (const char of cleanText) {
      letterFrequency.set(char, (letterFrequency.get(char) || 0) + 1);
    }

    const total = cleanText.length;
    const normalizedFreq = new Map<string, number>();
    for (const [letter, count] of letterFrequency) {
      normalizedFreq.set(letter, count / total);
    }

    let entropy = 0;
    for (const prob of normalizedFreq.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }

    return {
      letterFrequency: normalizedFreq,
      index_of_coincidence: this.calculateIoC(text),
      entropy,
      likelyLanguage: this.detectLanguage(normalizedFreq)
    };
  }

  private static detectLanguage(freq: Map<string, number>): string {
    const englishScore = this.calculateLanguageScore(freq, 'english');
    const spanishScore = this.calculateLanguageScore(freq, 'spanish');
    const frenchScore = this.calculateLanguageScore(freq, 'french');
    const germanScore = this.calculateLanguageScore(freq, 'german');

    const scores = [
      { lang: 'English', score: englishScore },
      { lang: 'Spanish', score: spanishScore },
      { lang: 'French', score: frenchScore },
      { lang: 'German', score: germanScore }
    ];

    scores.sort((a, b) => b.score - a.score);
    return scores[0].lang;
  }

  private static calculateLanguageScore(freq: Map<string, number>, language: string): number {
    const languageFreqs: Record<string, Map<string, number>> = {
      english: this.ENGLISH_FREQ,
      spanish: new Map([
        ['A', 0.125], ['B', 0.014], ['C', 0.039], ['D', 0.047],
        ['E', 0.136], ['F', 0.009], ['G', 0.011], ['H', 0.007],
        ['I', 0.063], ['J', 0.004], ['K', 0.001], ['L', 0.050],
        ['M', 0.032], ['N', 0.067], ['O', 0.086], ['P', 0.026],
        ['Q', 0.009], ['R', 0.068], ['S', 0.079], ['T', 0.047],
        ['U', 0.043], ['V', 0.009], ['W', 0.001], ['X', 0.002],
        ['Y', 0.011], ['Z', 0.004]
      ]),
      french: new Map([
        ['A', 0.081], ['B', 0.011], ['C', 0.031], ['D', 0.037],
        ['E', 0.162], ['F', 0.011], ['G', 0.012], ['H', 0.011],
        ['I', 0.072], ['J', 0.002], ['K', 0.001], ['L', 0.055],
        ['M', 0.030], ['N', 0.067], ['O', 0.055], ['P', 0.024],
        ['Q', 0.012], ['R', 0.065], ['S', 0.079], ['T', 0.061],
        ['U', 0.046], ['V', 0.011], ['W', 0.001], ['X', 0.004],
        ['Y', 0.003], ['Z', 0.001]
      ]),
      german: new Map([
        ['A', 0.065], ['B', 0.019], ['C', 0.031], ['D', 0.051],
        ['E', 0.174], ['F', 0.017], ['G', 0.020], ['H', 0.048],
        ['I', 0.076], ['J', 0.003], ['K', 0.012], ['L', 0.034],
        ['M', 0.025], ['N', 0.098], ['O', 0.026], ['P', 0.008],
        ['Q', 0.001], ['R', 0.070], ['S', 0.072], ['T', 0.062],
        ['U', 0.044], ['V', 0.007], ['W', 0.019], ['X', 0.001],
        ['Y', 0.001], ['Z', 0.011]
      ])
    };

    const langFreq = languageFreqs[language];
    if (!langFreq) return 0;

    let score = 0;
    for (const [letter, expected] of langFreq) {
      const observed = freq.get(letter) || 0;
      score += 1 - Math.abs(observed - expected);
    }

    return score;
  }
}

export const caesarCipher = new CaesarCipher();
