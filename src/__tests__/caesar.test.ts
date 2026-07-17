import { describe, it, expect } from 'vitest';
import { CaesarCipher } from '../core/engines/caesar';

describe('CaesarCipher', () => {
  describe('encrypt', () => {
    it('encrypts text with shift 1', () => {
      const result = CaesarCipher.encrypt('HELLO', 1);
      expect(result.ciphertext).toBe('IFMMP');
    });

    it('encrypts text with shift 0 (identity)', () => {
      const result = CaesarCipher.encrypt('HELLO', 0);
      expect(result.ciphertext).toBe('HELLO');
    });

    it('encrypts text with shift 26 (full rotation)', () => {
      const result = CaesarCipher.encrypt('HELLO', 26);
      expect(result.ciphertext).toBe('HELLO');
    });

    it('preserves non-alpha characters', () => {
      const result = CaesarCipher.encrypt('Hello, World!', 3);
      expect(result.ciphertext).toBe('KHOOR, ZRUOG!');
    });

    it('handles empty string', () => {
      const result = CaesarCipher.encrypt('', 5);
      expect(result.ciphertext).toBe('');
    });
  });

  describe('decrypt', () => {
    it('decrypts ciphertext back to plaintext', () => {
      const encrypted = CaesarCipher.encrypt('HELLO', 3);
      const decrypted = CaesarCipher.decrypt(encrypted.ciphertext, 3);
      expect(decrypted.ciphertext).toBe('HELLO');
    });

    it('roundtrips through encrypt/decrypt for all shifts', () => {
      const plaintext = 'THE QUICK BROWN FOX';
      for (let shift = 0; shift < 26; shift++) {
        const enc = CaesarCipher.encrypt(plaintext, shift);
        const dec = CaesarCipher.decrypt(enc.ciphertext, shift);
        expect(dec.ciphertext).toBe(plaintext);
      }
    });

    it('has correct metadata', () => {
      const result = CaesarCipher.encrypt('TEST', 5);
      expect(result.shift).toBe(5);
      expect(result.confidence).toBe(1.0);
      expect(result.method).toContain('Caesar');
    });
  });

  describe('bruteForce', () => {
    it('returns 26 results', () => {
      const results = CaesarCipher.bruteForce('HELLO');
      expect(results.length).toBe(26);
    });

    it('best result has highest confidence', () => {
      const results = CaesarCipher.bruteForce('KHOOR ZRUOG');
      expect(results[0].confidence).toBeGreaterThanOrEqual(results[1].confidence);
    });
  });
});
