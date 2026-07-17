import type { Plugin, PluginHooks } from '../types';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, PluginHooks> = new Map();

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already registered`);
      return;
    }

    this.plugins.set(plugin.id, plugin);
    this.hooks.set(plugin.id, plugin.hooks);
    
    console.log(`Plugin registered: ${plugin.name} v${plugin.version}`);
  }

  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
    this.hooks.delete(pluginId);
    
    console.log(`Plugin unregistered: ${pluginId}`);
  }

  enable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = true;
    }
  }

  disable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = false;
    }
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async executeHook<T>(
    hookName: keyof PluginHooks,
    data: T,
    transformer?: (data: T, hook: NonNullable<PluginHooks[keyof PluginHooks]>) => T
  ): Promise<T> {
    let result = data;
    
    for (const plugin of this.getEnabledPlugins()) {
      const hook = plugin.hooks[hookName];
      if (hook && transformer) {
        result = transformer(result, hook);
      }
    }
    
    return result;
  }

  async onEncrypt(data: string): Promise<string> {
    return this.executeHook(
      'onEncrypt',
      data,
      (d, hook) => (hook as (data: string) => string)(d)
    );
  }

  async onDecrypt(data: string): Promise<string> {
    return this.executeHook(
      'onDecrypt',
      data,
      (d, hook) => (hook as (data: string) => string)(d)
    );
  }

  exportPlugins(): Plugin[] {
    return this.getAllPlugins().map(plugin => ({
      ...plugin,
      hooks: {} // Don't export hooks for security
    }));
  }

  importPlugins(plugins: Plugin[]): void {
    for (const plugin of plugins) {
      // Validate plugin structure
      if (!plugin.id || !plugin.name || !plugin.version) {
        console.warn('Invalid plugin structure, skipping');
        continue;
      }
      
      this.register(plugin);
    }
  }
}

export const pluginManager = new PluginManager();
