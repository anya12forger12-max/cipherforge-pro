import type { 
  AnalysisStep, 
  BruteForceResult, 
  FrequencyAnalysisResult,
  StepByStepResult,
  CryptanalysisResult 
} from '../types/cryptography';

export class EnhancedCaesarCipher {
  private static readonly ENGLISH_COMMON_WORDS = new Set([
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER',
    'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'HAD', 'HAS', 'HIS', 'HOW', 'ITS',
    'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'WAY', 'WHO', 'DID', 'GET', 'LET',
    'SAY', 'SHE', 'TOO', 'USE', 'MAN', 'BIG', 'END', 'WHY', 'PUT', 'YET',
    'BEEN', 'HAVE', 'FROM', 'THIS', 'THAT', 'WITH', 'THEY', 'WILL', 'WOULD',
    'THERE', 'THEIR', 'ABOUT', 'COULD', 'OTHER', 'WHICH', 'THESE', 'FIRST'
  ]);

  private static readonly ENGLISH_FREQ = new Map([
    ['A', 0.0817], ['B', 0.0150], ['C', 0.0278], ['D', 0.0425],
    ['E', 0.1270], ['F', 0.0223], ['G', 0.0202], ['H', 0.0609],
    ['I', 0.0697], ['J', 0.0015], ['K', 0.0077], ['L', 0.0403],
    ['M', 0.0241], ['N', 0.0675], ['O', 0.0751], ['P', 0.0193],
    ['Q', 0.0010], ['R', 0.0599], ['S', 0.0633], ['T', 0.0906],
    ['U', 0.0276], ['V', 0.0098], ['W', 0.0236], ['X', 0.0015],
    ['Y', 0.0197], ['Z', 0.0007]
  ]);

  static encrypt(plaintext: string, shift: number): string {
    const normalizedShift = ((shift % 26) + 26) % 26;
    
    return plaintext.split('').map(char => {
      const code = char.charCodeAt(0);
      
      // Uppercase A-Z
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + normalizedShift) % 26) + 65);
      }
      
      // Lowercase a-z
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + normalizedShift) % 26) + 97);
      }
      
      // Preserve everything else (numbers, symbols, spaces, emojis, etc.)
      return char;
    }).join('');
  }

  static decrypt(ciphertext: string, shift: number): string {
    return this.encrypt(ciphertext, -shift);
  }

  static normalizeShift(shift: number): number {
    return ((shift % 26) + 26) % 26;
  }

  static generateStepByStep(text: string, shift: number): StepByStepResult {
    const startTime = performance.now();
    const steps: AnalysisStep[] = [];
    let totalLetters = 0;
    let totalShifted = 0;
    let totalPreserved = 0;

    const normalizedShift = this.normalizeShift(shift);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);
      const unicodeValue = 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
      
      let originalPosition = -1;
      let finalChar = char;
      let finalPosition = -1;
      let wrapAround = false;

      // Uppercase A-Z
      if (code >= 65 && code <= 90) {
        originalPosition = code - 65;
        totalLetters++;
        totalShifted++;
        finalPosition = (originalPosition + normalizedShift) % 26;
        wrapAround = (originalPosition + normalizedShift) >= 26;
        finalChar = String.fromCharCode(finalPosition + 65);
      }
      // Lowercase a-z
      else if (code >= 97 && code <= 122) {
        originalPosition = code - 97;
        totalLetters++;
        totalShifted++;
        finalPosition = (originalPosition + normalizedShift) % 26;
        wrapAround = (originalPosition + normalizedShift) >= 26;
        finalChar = String.fromCharCode(finalPosition + 97);
      }
      else {
        totalPreserved++;
      }

      steps.push({
        position: i,
        originalChar: char,
        originalPosition,
        asciiValue: code,
        unicodeValue,
        shiftApplied: normalizedShift,
        wrapAround,
        finalChar,
        finalPosition
      });
    }

    return {
      steps,
      totalCharacters: text.length,
      totalLetters,
      totalShifted,
      totalPreserved,
      processingTime: performance.now() - startTime
    };
  }

  static analyzeFrequency(text: string): FrequencyAnalysisResult {
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    const letterFreq = new Map<string, number>();
    const bigramFreq = new Map<string, number>();
    const trigramFreq = new Map<string, number>();
    const quadgramFreq = new Map<string, number>();
    const wordFreq = new Map<string, number>();

    // Letter frequency
    for (const char of cleanText) {
      letterFreq.set(char, (letterFreq.get(char) || 0) + 1);
    }

    // Normalize letter frequency
    const totalLetters = cleanText.length;
    for (const [key, value] of letterFreq) {
      letterFreq.set(key, value / totalLetters);
    }

    // Bigram frequency
    for (let i = 0; i < cleanText.length - 1; i++) {
      const bigram = cleanText.substring(i, i + 2);
      bigramFreq.set(bigram, (bigramFreq.get(bigram) || 0) + 1);
    }

    // Trigram frequency
    for (let i = 0; i < cleanText.length - 2; i++) {
      const trigram = cleanText.substring(i, i + 3);
      trigramFreq.set(trigram, (trigramFreq.get(trigram) || 0) + 1);
    }

    // Quadgram frequency
    for (let i = 0; i < cleanText.length - 3; i++) {
      const quadgram = cleanText.substring(i, i + 4);
      quadgramFreq.set(quadgram, (quadgramFreq.get(quadgram) || 0) + 1);
    }

    // Word frequency
    const words = text.split(/\s+/).filter(w => w.length > 0);
    for (const word of words) {
      const upperWord = word.toUpperCase().replace(/[^A-Z]/g, '');
      if (upperWord.length > 0) {
        wordFreq.set(upperWord, (wordFreq.get(upperWord) || 0) + 1);
      }
    }

    // Calculate entropy
    let entropy = 0;
    let shannonEntropy = 0;
    for (const prob of letterFreq.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
        shannonEntropy -= prob * Math.log(prob);
      }
    }

    // Chi-square score
    let chiSquare = 0;
    for (const [letter, expected] of this.ENGLISH_FREQ) {
      const observed = letterFreq.get(letter) || 0;
      const diff = observed - expected;
      chiSquare += (diff * diff) / expected;
    }

    // Index of Coincidence
    let iocSum = 0;
    for (const count of letterFreq.values()) {
      iocSum += count * (count * totalLetters - 1);
    }
    const index_of_coincidence = iocSum / (totalLetters * (totalLetters - 1) || 1);

    // Space and punctuation frequency
    const spaceCount = (text.match(/ /g) || []).length;
    const punctCount = (text.match(/[.,!?;:'"()\-]/g) || []).length;

    // Find most/least common
    let mostCommon = 'E';
    let leastCommon = 'Z';
    let maxFreq = 0;
    let minFreq = 1;

    for (const [letter, freq] of letterFreq) {
      if (freq > maxFreq) {
        maxFreq = freq;
        mostCommon = letter;
      }
      if (freq < minFreq) {
        minFreq = freq;
        leastCommon = letter;
      }
    }

    return {
      letterFrequency: letterFreq,
      bigramFrequency: bigramFreq,
      trigramFrequency: trigramFreq,
      quadgramFrequency: quadgramFreq,
      wordFrequency: wordFreq,
      entropy,
      shannonEntropy,
      chiSquareScore: chiSquare,
      index_of_coincidence: index_of_coincidence,
      spaceFrequency: spaceCount / text.length,
      punctuationFrequency: punctCount / text.length,
      mostCommonChar: mostCommon,
      leastCommonChar: leastCommon,
      uniqueChars: letterFreq.size,
      totalChars: text.length
    };
  }

  static bruteForce(ciphertext: string): BruteForceResult[] {
    const results: BruteForceResult[] = [];

    for (let shift = 0; shift < 26; shift++) {
      const plaintext = this.decrypt(ciphertext, shift);
      const freqAnalysis = this.analyzeFrequency(plaintext);
      
      // Calculate confidence score
      let confidenceScore = 0;
      const words = plaintext.split(/\s+/);
      let wordMatches = 0;

      for (const word of words) {
        const upperWord = word.toUpperCase().replace(/[^A-Z]/g, '');
        if (this.ENGLISH_COMMON_WORDS.has(upperWord)) {
          wordMatches++;
        }
      }

      // Word score (0-40 points)
      const wordScore = Math.min(40, (wordMatches / Math.max(words.length, 1)) * 100);

      // Character score based on frequency analysis (0-30 points)
      let charScore = 0;
      for (const [letter, expected] of this.ENGLISH_FREQ) {
        const observed = freqAnalysis.letterFrequency.get(letter) || 0;
        charScore += 1 - Math.abs(observed - expected);
      }
      charScore = (charScore / 26) * 30;

      // Entropy score (0-20 points) - lower entropy is better for English
      const entropyScore = Math.max(0, 20 - (freqAnalysis.entropy - 3.5) * 5);

      // Index of Coincidence score (0-10 points)
      const iocScore = Math.min(10, freqAnalysis.index_of_coincidence * 100);

      confidenceScore = wordScore + charScore + entropyScore + iocScore;

      // Dictionary match percentage
      const dictionaryMatchPercentage = (wordMatches / Math.max(words.length, 1)) * 100;

      // English probability
      const englishProbability = Math.min(100, confidenceScore * 1.1);

      // Generate notes
      const notes: string[] = [];
      if (wordMatches > 0) notes.push(`Found ${wordMatches} common English words`);
      if (freqAnalysis.entropy < 4) notes.push('Low entropy suggests structured text');
      if (freqAnalysis.index_of_coincidence > 0.06) notes.push('High IoC indicates English-like text');

      results.push({
        shift,
        plaintext,
        confidenceScore: Math.round(confidenceScore * 100) / 100,
        dictionaryMatchPercentage: Math.round(dictionaryMatchPercentage * 100) / 100,
        englishProbability: Math.round(englishProbability * 100) / 100,
        entropy: freqAnalysis.entropy,
        characterScore: Math.round(charScore * 100) / 100,
        wordScore: Math.round(wordScore * 100) / 100,
        ranking: 0,
        notes,
        isTopCandidate: false
      });
    }

    // Sort by confidence and assign rankings
    results.sort((a, b) => b.confidenceScore - a.confidenceScore);
    results.forEach((result, index) => {
      result.ranking = index + 1;
      result.isTopCandidate = index < 3;
    });

    return results;
  }

  static detectLanguage(text: string): Map<string, number> {
    const probabilities = new Map<string, number>();
    const freqAnalysis = this.analyzeFrequency(text);
    
    // Simple language detection based on character frequency patterns
    // In production, you'd use more sophisticated algorithms
    
    let englishScore = 0;
    for (const [letter, expected] of this.ENGLISH_FREQ) {
      const observed = freqAnalysis.letterFrequency.get(letter) || 0;
      englishScore += 1 - Math.abs(observed - expected);
    }
    probabilities.set('English', (englishScore / 26) * 100);

    // Add other languages with lower scores for demo
    probabilities.set('Spanish', Math.random() * 30 + 10);
    probabilities.set('French', Math.random() * 25 + 5);
    probabilities.set('German', Math.random() * 20 + 5);

    return probabilities;
  }

  static analyze(ciphertext: string): CryptanalysisResult {
    const bruteForceResults = this.bruteForce(ciphertext);
    const bestResult = bruteForceResults[0];
    const freqAnalysis = this.analyzeFrequency(ciphertext);
    const languageProbability = this.detectLanguage(this.decrypt(ciphertext, bestResult.shift));

    const alternativeShifts = bruteForceResults
      .slice(1, 4)
      .map(r => r.shift);

    let explanation = `Based on frequency analysis, the most likely shift is ${bestResult.shift}. `;
    explanation += `This gives a confidence score of ${bestResult.confidenceScore}%. `;
    
    if (bestResult.dictionaryMatchPercentage > 20) {
      explanation += `The text contains ${bestResult.dictionaryMatchPercentage.toFixed(1)}% common English words. `;
    }

    if (freqAnalysis.index_of_coincidence > 0.065) {
      explanation += 'The high Index of Coincidence suggests English-like text distribution. ';
    }

    let recommendedAction = 'Apply the detected shift to decrypt the message.';
    if (bestResult.confidenceScore < 30) {
      recommendedAction = 'Low confidence detected. Consider examining the text for non-English content or unusual formatting.';
    } else if (bestResult.confidenceScore > 70) {
      recommendedAction = 'High confidence detected. The decryption is likely accurate.';
    }

    return {
      detectedShift: bestResult.shift,
      confidenceScore: bestResult.confidenceScore,
      entropy: freqAnalysis.entropy,
      readabilityScore: bestResult.englishProbability,
      languageProbability,
      dictionaryMatch: bestResult.dictionaryMatchPercentage,
      characterStats: freqAnalysis,
      recommendedAction,
      explanation,
      alternativeShifts
    };
  }

  static calculateEntropy(text: string): number {
    const freq = new Map<string, number>();
    for (const char of text) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }

    let entropy = 0;
    const length = text.length;
    for (const count of freq.values()) {
      const prob = count / length;
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }

    return entropy;
  }

  static estimateCompression(text: string): number {
    // Simple estimation based on entropy
    const entropy = this.calculateEntropy(text);
    return (entropy / 8) * 100; // Percentage of original size
  }
}

export const enhancedCaesarCipher = new EnhancedCaesarCipher();
