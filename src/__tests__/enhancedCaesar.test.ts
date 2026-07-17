import { describe, it, expect } from 'vitest';
import { EnhancedCaesarCipher } from '../core/engines/enhancedCaesar';

describe('EnhancedCaesarCipher', () => {
  it('encrypts with shift 1', () => {
    const result = EnhancedCaesarCipher.encrypt('HELLO', 1);
    expect(result).toBe('IFMMP');
  });

  it('decrypts back to original', () => {
    const enc = EnhancedCaesarCipher.encrypt('HELLO', 5);
    const dec = EnhancedCaesarCipher.decrypt(enc, 5);
    expect(dec).toBe('HELLO');
  });

  it('handles empty input', () => {
    const result = EnhancedCaesarCipher.encrypt('', 1);
    expect(result).toBe('');
  });

  it('preserves spaces and punctuation', () => {
    const result = EnhancedCaesarCipher.encrypt('Hello, World!', 3);
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('wraps around Z', () => {
    const result = EnhancedCaesarCipher.encrypt('Z', 1);
    expect(result).toBe('A');
  });

  it('handles all shifts produce valid output', () => {
    for (let shift = 0; shift < 26; shift++) {
      const enc = EnhancedCaesarCipher.encrypt('HELLO WORLD', shift);
      const dec = EnhancedCaesarCipher.decrypt(enc, shift);
      expect(dec).toBe('HELLO WORLD');
    }
  });
});
