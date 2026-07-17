import { describe, it, expect, beforeEach } from 'vitest';
import { InputValidator } from '../core/security/inputValidator';

describe('InputValidator', () => {
  let validator: InputValidator;

  beforeEach(() => {
    validator = new InputValidator();
  });

  describe('validateText', () => {
    it('accepts valid text', () => {
      const result = validator.validateText('Hello World');
      expect(result.valid).toBe(true);
    });

    it('warns on empty text', () => {
      const result = validator.validateText('');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('errors on non-string input', () => {
      const result = validator.validateText(123 as unknown as string);
      expect(result.valid).toBe(false);
    });

    it('detects null bytes', () => {
      const result = validator.validateText('Hello\x00World');
      expect(result.warnings.some(w => w.code === 'NULL_BYTES')).toBe(true);
    });
  });

  describe('validateFileName', () => {
    it('accepts valid filenames', () => {
      const result = validator.validateFileName('document.txt');
      expect(result.valid).toBe(true);
    });

    it('rejects empty filenames', () => {
      const result = validator.validateFileName('');
      expect(result.valid).toBe(false);
    });

    it('rejects invalid characters', () => {
      const result = validator.validateFileName('file<>:"|?*.txt');
      expect(result.valid).toBe(false);
    });

    it('warns about hidden files', () => {
      const result = validator.validateFileName('.hidden');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('rejects Windows reserved names', () => {
      const result = validator.validateFileName('CON.txt');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFilePath', () => {
    it('rejects path traversal', () => {
      const result = validator.validateFilePath('/etc/../passwd');
      expect(result.valid).toBe(false);
    });

    it('rejects null bytes in path', () => {
      const result = validator.validateFilePath('/tmp/file\x00.txt');
      expect(result.valid).toBe(false);
    });

    it('rejects shell injection patterns', () => {
      const result = validator.validateFilePath('file$(cmd).txt');
      expect(result.valid).toBe(false);
    });

    it('rejects command chaining', () => {
      const result = validator.validateFilePath('file;rm -rf /');
      expect(result.valid).toBe(false);
    });

    it('rejects paths starting with /', () => {
      const result = validator.validateFilePath('/home/user/file.txt');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('accepts normal files', () => {
      const result = validator.validateFileSize(1024);
      expect(result.valid).toBe(true);
    });

    it('rejects negative sizes', () => {
      const result = validator.validateFileSize(-1);
      expect(result.valid).toBe(false);
    });

    it('rejects oversized files', () => {
      const result = validator.validateFileSize(200 * 1024 * 1024);
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePluginManifest', () => {
    it('rejects missing required fields', () => {
      const result = validator.validatePluginManifest({});
      expect(result.valid).toBe(false);
    });

    it('accepts valid manifest', () => {
      const result = validator.validatePluginManifest({
        id: 'test-plugin',
        name: 'Test',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author'
      });
      expect(result.valid).toBe(true);
    });

    it('rejects invalid semver', () => {
      const result = validator.validatePluginManifest({
        id: 'test', name: 'Test', version: 'not-a-version'
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateConfiguration', () => {
    it('rejects non-object configs', () => {
      const result = validator.validateConfiguration(null as unknown as Record<string, unknown>);
      expect(result.valid).toBe(false);
    });

    it('accepts valid config', () => {
      const result = validator.validateConfiguration({
        version: '1.0.0',
        theme: 'dark'
      });
      expect(result.valid).toBe(true);
    });
  });
});
