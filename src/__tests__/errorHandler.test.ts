import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler } from '../core/security/errorHandler';

describe('ErrorHandler', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = new ErrorHandler({ logErrors: false });
  });

  it('creates error with correct properties', () => {
    const error = handler.handleError('FILE_NOT_FOUND', 'Test file missing');
    expect(error.code).toBe('FILE_NOT_FOUND');
    expect(error.message).toBe('Test file missing');
    expect(error.severity).toBe('medium');
    expect(error.recoverable).toBe(true);
    expect(error.recoverySuggestion).toBeTruthy();
  });

  it('classifies known errors correctly', () => {
    const permError = handler.handleCaughtError(new Error('permission denied'));
    expect(permError.code).toBe('PERMISSION_DENIED');
    expect(permError.severity).toBe('high');
  });

  it('classifies unknown errors', () => {
    const unknownError = handler.handleCaughtError(new Error('something weird happened'));
    expect(unknownError.code).toBe('UNKNOWN');
  });

  it('tracks error statistics', () => {
    handler.handleError('FILE_NOT_FOUND', 'Missing');
    handler.handleError('MEMORY_PRESSURE', 'Low memory');
    handler.handleError('MEMORY_PRESSURE', 'Still low');
    const stats = handler.getStats();
    expect(stats.total).toBe(3);
    expect(stats.bySeverity.medium).toBe(1);
    expect(stats.bySeverity.high).toBe(2);
  });

  it('filters errors by severity', () => {
    handler.handleError('FILE_NOT_FOUND', 'Missing');
    handler.handleError('DISK_FULL', 'Full');
    const critical = handler.getErrorsBySeverity('critical');
    expect(critical.length).toBe(1);
  });

  it('filters errors by code', () => {
    handler.handleError('FILE_NOT_FOUND', 'one');
    handler.handleError('FILE_NOT_FOUND', 'two');
    handler.handleError('DISK_FULL', 'three');
    expect(handler.getErrorsByCode('FILE_NOT_FOUND').length).toBe(2);
  });

  it('clears errors', () => {
    handler.handleError('FILE_NOT_FOUND', 'test');
    handler.clearErrors();
    expect(handler.getStats().total).toBe(0);
  });

  it('emits errors to listeners', () => {
    const callback = vi.fn();
    handler.onError(callback);
    handler.handleError('FILE_NOT_FOUND', 'test');
    expect(callback).toHaveBeenCalledOnce();
  });

  it('retries operations successfully', async () => {
    let attempts = 0;
    const result = await handler.retryOperation(async () => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return 'success';
    }, { maxAttempts: 3, delayMs: 1, module: 'test' });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});
