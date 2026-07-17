import type { CipherModule } from './cipherEngine';
import { vigenereCipher } from './vigenere';

export { vigenereCipher } from './vigenere';

export interface CipherRegistryEntry {
  module: CipherModule;
  enabled: boolean;
  loadedAt: Date;
  isBuiltIn: boolean;
}

class CipherRegistry {
  private modules: Map<string, CipherRegistryEntry> = new Map();

  constructor() {
    this.registerBuiltIn(vigenereCipher);
  }

  registerBuiltIn(module: CipherModule): void {
    this.modules.set(module.id, {
      module,
      enabled: true,
      loadedAt: new Date(),
      isBuiltIn: true
    });
  }

  register(module: CipherModule): boolean {
    if (this.modules.has(module.id)) return false;
    this.modules.set(module.id, {
      module,
      enabled: true,
      loadedAt: new Date(),
      isBuiltIn: false
    });
    return true;
  }

  unregister(id: string): boolean {
    return this.modules.delete(id);
  }

  get(id: string): CipherRegistryEntry | undefined {
    return this.modules.get(id);
  }

  getAll(): CipherRegistryEntry[] {
    return Array.from(this.modules.values());
  }

  getEnabled(): CipherModule[] {
    return this.getAll().filter(e => e.enabled).map(e => e.module);
  }

  enable(id: string): boolean {
    const entry = this.modules.get(id);
    if (!entry) return false;
    entry.enabled = true;
    return true;
  }

  disable(id: string): boolean {
    const entry = this.modules.get(id);
    if (!entry) return false;
    entry.enabled = false;
    return true;
  }

  getById(id: string): CipherModule | undefined {
    return this.modules.get(id)?.module;
  }
}

export const cipherRegistry = new CipherRegistry();
