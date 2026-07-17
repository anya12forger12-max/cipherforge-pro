import { describe, it, expect } from 'vitest';
import { VigenereCipher } from '../core/crypto/vigenere';

describe('VigenereCipher', () => {
  const cipher = new VigenereCipher();

  describe('encrypt', () => {
    it('encrypts with keyword SECRET', () => {
      const result = cipher.encrypt('HELLO WORLD', { key: 'SECRET' });
      expect(result.output).toBeTruthy();
      expect(result.algorithm).toBe('vigenere');
      expect(result.direction).toBe('encrypt');
    });

    it('returns empty output with empty key', () => {
      const result = cipher.encrypt('HELLO', { key: '' });
      expect(result.output).toBe('');
    });

    it('handles empty input', () => {
      const result = cipher.encrypt('', { key: 'KEY' });
      expect(result.output).toBe('');
    });

    it('preserves non-alpha characters', () => {
      const result = cipher.encrypt('Hello, World!', { key: 'KEY' });
      expect(result.output).toContain(',');
      expect(result.output).toContain('!');
      expect(result.output).toContain(' ');
    });

    it('same key produces same output', () => {
      const r1 = cipher.encrypt('TEST', { key: 'ABC' });
      const r2 = cipher.encrypt('TEST', { key: 'ABC' });
      expect(r1.output).toBe(r2.output);
    });
  });

  describe('decrypt', () => {
    it('roundtrips encrypt/decrypt', () => {
      const plaintext = 'ATTACK AT DAWN';
      const key = 'LEMON';
      const enc = cipher.encrypt(plaintext, { key });
      const dec = cipher.decrypt(enc.output, { key });
      expect(dec.output).toBe(plaintext);
    });

    it('different keys produce different results', () => {
      const enc1 = cipher.encrypt('HELLO', { key: 'A' });
      const enc2 = cipher.encrypt('HELLO', { key: 'B' });
      expect(enc1.output).not.toBe(enc2.output);
    });
  });

  describe('metadata', () => {
    it('has correct id', () => {
      expect(cipher.id).toBe('vigenere');
    });

    it('is marked as not secure', () => {
      expect(cipher.isSecure).toBe(false);
    });

    it('has security disclaimer', () => {
      expect(cipher.securityDisclaimer).toContain('NOT secure');
    });

    it('has parameters defined', () => {
      expect(cipher.parameters.length).toBeGreaterThan(0);
      expect(cipher.parameters[0].name).toBe('key');
    });
  });

  describe('analyze', () => {
    it('returns analysis result', () => {
      const result = cipher.analyze('THIS IS A LONGER TEXT FOR ANALYSIS TESTING PURPOSES');
      expect(result.algorithm).toBe('vigenere');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.explanation).toBeTruthy();
    });

    it('returns low confidence for short text', () => {
      const result = cipher.analyze('HI');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('bruteForce', () => {
    it('returns candidate results', () => {
      const results = cipher.bruteForce('HELLO WORLD', { maxResults: 5 });
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });
});
