import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Accessibility, 
  Shield, 
  Keyboard,
  Save,
  RotateCcw
} from 'lucide-react';
import { useThemeStore } from '../themes';

type SettingsTab = 'general' | 'appearance' | 'accessibility' | 'privacy' | 'shortcuts';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { themes, currentTheme, setTheme } = useThemeStore();
  const [settings, setSettings] = useState({
    general: {
      autoSave: true,
      autoSaveInterval: 5,
      confirmOnExit: true,
      defaultView: 'dashboard' as const,
      startupBehavior: 'welcome' as const
    },
    appearance: {
      theme: currentTheme.id,
      fontSize: 'medium',
      fontFamily: 'Inter',
      borderRadius: 'medium',
      animations: true,
      transparency: false,
      density: 'comfortable' as const
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      screenReader: false,
      keyboardNavigation: true,
      focusIndicators: true,
      audioFeedback: false,
      largeText: false,
      zoom: 100,
      colorBlindMode: 'none' as string
    },
    privacy: {
      analytics: false,
      crashReporting: false,
      saveHistory: true,
      historyRetentionDays: 30,
      clearOnExit: false
    }
  });

  const tabs = [
    { id: 'general' as SettingsTab, label: 'General', icon: SettingsIcon },
    { id: 'appearance' as SettingsTab, label: 'Appearance', icon: Palette },
    { id: 'accessibility' as SettingsTab, label: 'Accessibility', icon: Accessibility },
    { id: 'privacy' as SettingsTab, label: 'Privacy', icon: Shield },
    { id: 'shortcuts' as SettingsTab, label: 'Keyboard Shortcuts', icon: Keyboard }
  ];

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('cipherforge-settings', JSON.stringify(settings));
  };

  const handleReset = () => {
    // Reset to defaults
    localStorage.removeItem('cipherforge-settings');
    window.location.reload();
  };

  return (
    <div className="settings animate-fadeIn" role="region" aria-label="Settings">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
          Settings
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Configure CipherForge Pro to your preferences
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Settings Navigation */}
        <nav aria-label="Settings navigation">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {tabs.map(tab => (
              <li key={tab.id} style={{ marginBottom: 'var(--spacing-xs)' }}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    width: '100%',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Settings Content */}
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          {activeTab === 'general' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                General Settings
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.general.autoSave}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, autoSave: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Enable Auto-save</span>
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)', marginLeft: '26px' }}>
                    Automatically save your work at regular intervals
                  </p>
                </div>

                <div>
                  <label htmlFor="save-interval" style={{ display: 'block', marginBottom: 'var(--spacing-sm)' }}>
                    Auto-save Interval (minutes)
                  </label>
                  <input
                    id="save-interval"
                    type="number"
                    className="input"
                    min={1}
                    max={60}
                    value={settings.general.autoSaveInterval}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, autoSaveInterval: parseInt(e.target.value) || 5 }
                    })}
                    style={{ width: '120px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.general.confirmOnExit}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, confirmOnExit: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Confirm before closing</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Appearance Settings
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div>
                  <label htmlFor="theme-select" style={{ display: 'block', marginBottom: 'var(--spacing-sm)' }}>
                    Theme
                  </label>
                  <select
                    id="theme-select"
                    className="input"
                    value={currentTheme.id}
                    onChange={(e) => {
                      setTheme(e.target.value);
                      setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, theme: e.target.value }
                      });
                    }}
                    style={{ width: '200px' }}
                  >
                    {themes.map((theme: { id: string; name: string }) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="font-size" style={{ display: 'block', marginBottom: 'var(--spacing-sm)' }}>
                    Font Size
                  </label>
                  <select
                    id="font-size"
                    className="input"
                    value={settings.appearance.fontSize}
                    onChange={(e) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, fontSize: e.target.value }
                    })}
                    style={{ width: '200px' }}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.appearance.animations}
                      onChange={(e) => setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, animations: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Enable animations</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Accessibility Settings
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.accessibility.reducedMotion}
                      onChange={(e) => setSettings({
                        ...settings,
                        accessibility: { ...settings.accessibility, reducedMotion: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Reduce motion</span>
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)', marginLeft: '26px' }}>
                    Minimize animations for users with motion sensitivity
                  </p>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.accessibility.highContrast}
                      onChange={(e) => setSettings({
                        ...settings,
                        accessibility: { ...settings.accessibility, highContrast: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>High contrast mode</span>
                  </label>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.accessibility.largeText}
                      onChange={(e) => setSettings({
                        ...settings,
                        accessibility: { ...settings.accessibility, largeText: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Large text</span>
                  </label>
                </div>

                <div>
                  <label htmlFor="zoom" style={{ display: 'block', marginBottom: 'var(--spacing-sm)' }}>
                    Zoom Level: {settings.accessibility.zoom}%
                  </label>
                  <input
                    id="zoom"
                    type="range"
                    min={50}
                    max={200}
                    value={settings.accessibility.zoom}
                    onChange={(e) => setSettings({
                      ...settings,
                      accessibility: { ...settings.accessibility, zoom: parseInt(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label htmlFor="color-blind" style={{ display: 'block', marginBottom: 'var(--spacing-sm)' }}>
                    Color Blind Mode
                  </label>
                  <select
                    id="color-blind"
                    className="input"
                    value={settings.accessibility.colorBlindMode}
                    onChange={(e) => setSettings({
                      ...settings,
                      accessibility: { ...settings.accessibility, colorBlindMode: e.target.value as 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' }
                    })}
                    style={{ width: '200px' }}
                  >
                    <option value="none">None</option>
                    <option value="protanopia">Protanopia (Red-green)</option>
                    <option value="deuteranopia">Deuteranopia (Red-green)</option>
                    <option value="tritanopia">Tritanopia (Blue-yellow)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Privacy Settings
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div
                  style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'color-mix(in srgb, var(--color-info) 10%, var(--color-surface))',
                    border: '1px solid color-mix(in srgb, var(--color-info) 30%, var(--color-border))',
                    borderRadius: 'var(--border-radius-md)'
                  }}
                >
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                    <strong>Privacy First:</strong> CipherForge Pro processes all data locally on your device. 
                    No data is sent to external servers unless you explicitly enable optional features.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.saveHistory}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, saveHistory: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Save history</span>
                  </label>
                </div>

                <div>
                  <label htmlFor="retention" style={{ display: 'block', marginBottom: 'var(--spacing-sm)' }}>
                    History Retention (days)
                  </label>
                  <input
                    id="retention"
                    type="number"
                    className="input"
                    min={1}
                    max={365}
                    value={settings.privacy.historyRetentionDays}
                    onChange={(e) => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, historyRetentionDays: parseInt(e.target.value) || 30 }
                    })}
                    style={{ width: '120px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.clearOnExit}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, clearOnExit: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Clear history on exit</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Keyboard Shortcuts
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {[
                  { action: 'Encrypt', shortcut: 'Ctrl + E' },
                  { action: 'Decrypt', shortcut: 'Ctrl + D' },
                  { action: 'Brute Force', shortcut: 'Ctrl + B' },
                  { action: 'Frequency Analysis', shortcut: 'Ctrl + F' },
                  { action: 'Open File', shortcut: 'Ctrl + O' },
                  { action: 'Save', shortcut: 'Ctrl + S' },
                  { action: 'Export', shortcut: 'Ctrl + Shift + S' },
                  { action: 'Clear', shortcut: 'Ctrl + L' },
                  { action: 'Command Palette', shortcut: 'Ctrl + P' },
                  { action: 'Help', shortcut: 'F1' },
                  { action: 'Settings', shortcut: 'Ctrl + ,' }
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      backgroundColor: index % 2 === 0 ? 'var(--color-background)' : 'transparent',
                      borderRadius: 'var(--border-radius-md)'
                    }}
                  >
                    <span style={{ fontSize: '0.875rem' }}>{item.action}</span>
                    <kbd
                      style={{
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--border-radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem'
                      }}
                    >
                      {item.shortcut}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save/Reset Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              marginTop: 'var(--spacing-xl)',
              paddingTop: 'var(--spacing-lg)',
              borderTop: '1px solid var(--color-border)'
            }}
          >
            <button onClick={handleSave} className="button button-primary">
              <Save size={16} />
              Save Settings
            </button>
            <button onClick={handleReset} className="button button-secondary">
              <RotateCcw size={16} />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
