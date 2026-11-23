import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Node 20+ exposes an experimental global `localStorage` that is undefined unless
// --localstorage-file is set, which shadows jsdom's implementation. Provide a
// deterministic in-memory stub so modules that read storage at import time work.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => { store.delete(key); },
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
  };
  vi.stubGlobal('localStorage', storage);
}
