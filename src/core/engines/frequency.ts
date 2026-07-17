import type { FrequencyData, BruteForceResult } from '../types';

export class FrequencyAnalyzer {
  private static readonly ENGLISH_FREQ = new Map([
    ['A', 0.082], ['B', 0.015], ['C', 0.028], ['D', 0.043],
    ['E', 0.127], ['F', 0.022], ['G', 0.020], ['H', 0.061],
    ['I', 0.070], ['J', 0.002], ['K', 0.008], ['L', 0.040],
    ['M', 0.024], ['N', 0.067], ['O', 0.075], ['P', 0.019],
    ['Q', 0.001], ['R', 0.060], ['S', 0.063], ['T', 0.091],
    ['U', 0.028], ['V', 0.010], ['W', 0.023], ['X', 0.001],
    ['Y', 0.020], ['Z', 0.001]
  ]);

  static analyze(text: string): FrequencyData {
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    const letterFrequencies = this.calculateFrequencies(cleanText);
    const chiSquared = this.calculateChiSquared(letterFrequencies, cleanText.length);
    const correlation = this.calculateCorrelation(letterFrequencies);
    const topShifts = this.findTopShifts(text);

    return {
      letterFrequencies,
      expectedFrequencies: this.ENGLISH_FREQ,
      chiSquared,
      correlation,
      topShifts
    };
  }

  private static calculateFrequencies(text: string): Map<string, number> {
    const freq = new Map<string, number>();
    const total = text.length;

    for (const char of text) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }

    const normalized = new Map<string, number>();
    for (const [letter, count] of freq) {
      normalized.set(letter, count / total);
    }

    return normalized;
  }

  private static calculateChiSquared(observed: Map<string, number>, totalLength: number): number {
    let chiSquared = 0;

    for (const [letter, expected] of this.ENGLISH_FREQ) {
      const observedCount = (observed.get(letter) || 0) * totalLength;
      const expectedCount = expected * totalLength;
      
      if (expectedCount > 0) {
        chiSquared += Math.pow(observedCount - expectedCount, 2) / expectedCount;
      }
    }

    return chiSquared;
  }

  private static calculateCorrelation(observed: Map<string, number>): number {
    const expectedArray: number[] = [];
    const observedArray: number[] = [];

    for (const [letter, expected] of this.ENGLISH_FREQ) {
      expectedArray.push(expected);
      observedArray.push(observed.get(letter) || 0);
    }

    const n = expectedArray.length;
    const meanExpected = expectedArray.reduce((a, b) => a + b, 0) / n;
    const meanObserved = observedArray.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominatorExpected = 0;
    let denominatorObserved = 0;

    for (let i = 0; i < n; i++) {
      const diffExpected = expectedArray[i] - meanExpected;
      const diffObserved = observedArray[i] - meanObserved;
      
      numerator += diffExpected * diffObserved;
      denominatorExpected += diffExpected * diffExpected;
      denominatorObserved += diffObserved * diffObserved;
    }

    const denominator = Math.sqrt(denominatorExpected * denominatorObserved);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private static findTopShifts(text: string, count: number = 5): number[] {
    const scores = new Map<number, number>();

    for (let shift = 0; shift < 26; shift++) {
      const decrypted = this.applyShift(text, shift);
      const freq = this.calculateFrequencies(decrypted);
      const score = this.calculateCorrelation(freq);
      scores.set(shift, score);
    }

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([shift]) => shift);
  }

  private static applyShift(text: string, shift: number): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return text
      .toUpperCase()
      .split('')
      .map(char => {
        if (alphabet.includes(char)) {
          const index = alphabet.indexOf(char);
          return alphabet[(index + shift) % 26];
        }
        return char;
      })
      .join('');
  }

  static bruteForce(text: string): BruteForceResult[] {
    const results: BruteForceResult[] = [];

    for (let shift = 0; shift < 26; shift++) {
      const decrypted = this.applyShift(text, shift);
      const freq = this.calculateFrequencies(decrypted);
      const score = this.calculateCorrelation(freq);
      const chiSquared = this.calculateChiSquared(freq, decrypted.replace(/[^A-Z]/g, '').length);
      const wordMatches = this.countWordMatches(decrypted);

      results.push({
        shift,
        plaintext: decrypted,
        score,
        chiSquared,
        wordMatches
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private static countWordMatches(text: string): number {
    const commonWords = [
      'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER',
      'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'HAD', 'HAS', 'HIS', 'HOW', 'ITS',
      'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'WAY', 'WHO', 'DID', 'GET', 'LET',
      'SAY', 'SHE', 'TOO', 'USE', 'MAN', 'BIG', 'END', 'Why', 'Put', 'Yet'
    ];

    const words = text.split(/\s+/);
    let matches = 0;

    for (const word of words) {
      if (commonWords.includes(word.toUpperCase())) {
        matches++;
      }
    }

    return matches;
  }

  static visualizeFrequencyData(data: FrequencyData): {
    barChartData: { label: string; value: number; expected: number }[];
    pieChartData: { label: string; value: number }[];
    comparisonData: { letter: string; observed: number; expected: number; difference: number }[];
  } {
    const barChartData: { label: string; value: number; expected: number }[] = [];
    const pieChartData: { label: string; value: number }[] = [];
    const comparisonData: { letter: string; observed: number; expected: number; difference: number }[] = [];

    for (const [letter, expected] of data.expectedFrequencies) {
      const observed = data.letterFrequencies.get(letter) || 0;
      
      barChartData.push({
        label: letter,
        value: observed,
        expected
      });

      pieChartData.push({
        label: letter,
        value: observed
      });

      comparisonData.push({
        letter,
        observed,
        expected,
        difference: observed - expected
      });
    }

    return { barChartData, pieChartData, comparisonData };
  }
}

export const frequencyAnalyzer = new FrequencyAnalyzer();
