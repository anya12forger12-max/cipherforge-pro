import { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Palette,
  Accessibility,
  Shield,
  Sparkles,
  X
} from 'lucide-react';

interface WizardStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface FirstLaunchWizardProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const STEPS: WizardStep[] = [
  { id: 'welcome', title: 'Welcome', icon: <Sparkles size={24} />, description: 'Welcome to CipherForge Pro' },
  { id: 'theme', title: 'Theme', icon: <Palette size={24} />, description: 'Choose your preferred theme' },
  { id: 'accessibility', title: 'Accessibility', icon: <Accessibility size={24} />, description: 'Configure accessibility options' },
  { id: 'privacy', title: 'Privacy', icon: <Shield size={24} />, description: 'Review privacy settings' },
  { id: 'complete', title: 'Get Started', icon: <Check size={24} />, description: 'You are ready!' }
];

const THEMES = [
  { id: 'dark', name: 'Dark', preview: '#0f172a' },
  { id: 'light', name: 'Light', preview: '#f8fafc' },
  { id: 'cyber-green', name: 'Cyber Green', preview: '#0a1a0a' },
  { id: 'midnight-blue', name: 'Midnight Blue', preview: '#0a0f2e' },
  { id: 'high-contrast', name: 'High Contrast', preview: '#000000' }
];

export function FirstLaunchWizard({ isOpen, onComplete, onSkip }: FirstLaunchWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [accessibility, setAccessibility] = useState({
    reducedMotion: false,
    highContrast: false,
    screenReader: false,
    largeText: false,
    keyboardNav: true
  });
  const [privacy, setPrivacy] = useState({
    saveHistory: true,
    autoSave: true,
    clearOnExit: false,
    acceptedPolicy: false
  });

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  const next = () => {
    if (isLast) {
      if (!privacy.acceptedPolicy) {
        return;
      }
      localStorage.setItem('cipherforge-onboarded', 'true');
      localStorage.setItem('cipherforge-wizard-theme', selectedTheme);
      localStorage.setItem('cipherforge-wizard-accessibility', JSON.stringify(accessibility));
      localStorage.setItem('cipherforge-wizard-privacy', JSON.stringify(privacy));
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prev = () => {
    if (!isFirst) setCurrentStep(currentStep - 1);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        background: 'var(--color-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            {step.icon}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{step.title}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>{step.description}</p>
            </div>
          </div>
          <button
            onClick={onSkip}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex' }}
            aria-label="Skip setup wizard"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '4px', padding: '0 var(--spacing-lg)', marginTop: 'var(--spacing-md)' }}>
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              style={{
                flex: 1,
                height: '3px',
                borderRadius: '2px',
                background: i <= currentStep ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'background 0.3s'
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 'var(--spacing-xl)', overflowY: 'auto' }}>
          {step.id === 'welcome' && (
            <div style={{ textAlign: 'center' }}>
              <Sparkles size={64} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-lg)' }} />
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Welcome to CipherForge Pro</h2>
              <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                An enterprise-grade educational cryptography toolkit. Let's set up your workspace in just a few steps.
              </p>
              <div style={{
                marginTop: 'var(--spacing-lg)',
                padding: 'var(--spacing-md)',
                background: 'var(--color-warning)',
                color: 'white',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '0.85rem'
              }}>
                <strong>Educational Notice:</strong> The Caesar Cipher is historical and NOT secure for real-world use.
              </div>
            </div>
          )}

          {step.id === 'theme' && (
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Choose Your Theme</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    style={{
                      padding: 'var(--spacing-md)',
                      borderRadius: 'var(--border-radius-md)',
                      border: selectedTheme === theme.id ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                      background: theme.preview,
                      cursor: 'pointer',
                      textAlign: 'center',
                      color: theme.id === 'light' ? '#1e293b' : '#f8fafc'
                    }}
                  >
                    <div style={{ width: '100%', height: '60px', borderRadius: '4px', background: theme.preview, marginBottom: 'var(--spacing-sm)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{theme.name}</span>
                    {selectedTheme === theme.id && <Check size={16} style={{ marginLeft: '4px' }} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step.id === 'accessibility' && (
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Accessibility Options</h3>
              {[
                { key: 'reducedMotion', label: 'Reduce Animations', desc: 'Minimize motion effects' },
                { key: 'highContrast', label: 'High Contrast', desc: 'Increase color contrast' },
                { key: 'screenReader', label: 'Screen Reader Optimized', desc: 'Enhanced ARIA labels' },
                { key: 'largeText', label: 'Large Text', desc: 'Increase base font size' },
                { key: 'keyboardNav', label: 'Enhanced Keyboard Navigation', desc: 'Visible focus indicators' }
              ].map(opt => (
                <label key={opt.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-sm)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={(accessibility as Record<string, boolean>)[opt.key]}
                    onChange={e => setAccessibility({ ...accessibility, [opt.key]: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>{opt.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {step.id === 'privacy' && (
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Privacy Settings</h3>
              <div style={{
                padding: 'var(--spacing-md)',
                background: 'var(--color-info)',
                color: 'white',
                borderRadius: 'var(--border-radius-md)',
                marginBottom: 'var(--spacing-md)',
                fontSize: '0.85rem'
              }}>
                CipherForge Pro is 100% offline. No data ever leaves your device.
              </div>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <input
                  type="checkbox"
                  checked={privacy.acceptedPolicy}
                  onChange={e => setPrivacy({ ...privacy, acceptedPolicy: e.target.checked })}
                  style={{ width: '18px', height: '18px', marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>Privacy Policy Consent (Required)</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    I explicitly accept the Privacy Policy to use CipherForge Pro. You must accept to continue.
                  </div>
                </div>
              </label>
              {[
                { key: 'saveHistory', label: 'Save History', desc: 'Remember your recent operations' },
                { key: 'autoSave', label: 'Auto-save Workspaces', desc: 'Automatically save your work' },
                { key: 'clearOnExit', label: 'Clear Data on Exit', desc: 'Erase all data when closing' }
              ].map(opt => (
                <label key={opt.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-sm)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={(privacy as Record<string, boolean>)[opt.key]}
                    onChange={e => setPrivacy({ ...privacy, [opt.key]: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>{opt.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {step.id === 'complete' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--spacing-lg)'
              }}>
                <Check size={40} color="white" />
              </div>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>You Are All Set!</h2>
              <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                CipherForge Pro is ready. You can always change these settings later in Settings.
              </p>
              <div style={{ marginTop: 'var(--spacing-lg)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                <p>Keyboard shortcuts:</p>
                <p><kbd style={{ padding: '2px 6px', background: 'var(--color-border)', borderRadius: '4px' }}>Ctrl+P</kbd> Command Palette</p>
                <p><kbd style={{ padding: '2px 6px', background: 'var(--color-border)', borderRadius: '4px' }}>Ctrl+E</kbd> Encrypt</p>
                <p><kbd style={{ padding: '2px 6px', background: 'var(--color-border)', borderRadius: '4px' }}>F1</kbd> Help</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          borderTop: '1px solid var(--color-border)'
        }}>
          <button
            onClick={prev}
            disabled={isFirst}
            className="btn btn-secondary"
            style={{ opacity: isFirst ? 0.4 : 1, pointerEvents: isFirst ? 'none' : 'auto' }}
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button onClick={onSkip} className="btn btn-secondary">
              Skip All
            </button>
            <button
              onClick={() => {
                if (isLast && !privacy.acceptedPolicy) {
                  alert('You must explicitly accept the Privacy Policy to proceed.');
                  return;
                }
                next();
              }}
              className="btn btn-primary"
              style={isLast && !privacy.acceptedPolicy ? { opacity: 0.5 } : undefined}
            >
              {isLast ? 'Get Started' : 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
