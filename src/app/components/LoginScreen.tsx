import { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import {
  MIN_PASSWORD_LENGTH,
  hasRegisteredUser,
  normalizeEmail,
  recordConsent,
  registerUser,
  signIn
} from '../../core/security/authManager';

type AuthMode = 'signIn' | 'create';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

const CONSENT_LABEL = 'I explicitly accept the Privacy Policy to use CipherForge Pro.';
const CONSENT_ERROR = 'You must explicitly accept the Privacy Policy to proceed.';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--spacing-md)',
  borderRadius: 'var(--border-radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background)',
  color: 'var(--color-text)',
  fontSize: '0.9rem',
  outline: 'none'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 500,
  marginBottom: 'var(--spacing-xs)'
};

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  // Creating an account stays available at any time: the default view only
  // reflects whether this device already holds an account.
  const [mode, setMode] = useState<AuthMode>(() => (hasRegisteredUser() ? 'signIn' : 'create'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isCreate = mode === 'create';

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setPassword('');
    setConfirmPassword('');
    setConsent(false);
    setShowPassword(false);
    setError('');
    setBusy(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');

    if (!consent) {
      setError(CONSENT_ERROR);
      return;
    }

    const normalized = normalizeEmail(email);
    if (!normalized || !email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (isCreate && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const result = isCreate
        ? await registerUser(normalized, password)
        : await signIn(normalized, password);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      recordConsent(result.email);
      onAuthenticated();
    } catch {
      setError('Something went wrong while verifying your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--color-background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 'var(--spacing-lg)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--color-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--color-border)',
        padding: 'var(--spacing-xl)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <Shield size={48} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }} />
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            {isCreate ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: 'var(--spacing-sm)' }}>
            {isCreate
              ? 'Create an account to secure your workspace.'
              : 'Sign in to your account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label htmlFor="login-email" style={labelStyle}>
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: isCreate ? 'var(--spacing-md)' : 'var(--spacing-lg)' }}>
            <label htmlFor="login-password" style={labelStyle}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isCreate ? 'new-password' : 'current-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ ...inputStyle, paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                style={{
                  position: 'absolute',
                  right: 'var(--spacing-sm)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  padding: 'var(--spacing-xs)'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isCreate && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label htmlFor="login-confirm-password" style={labelStyle}>
                Confirm password
              </label>
              <input
                id="login-confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
              />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', margin: 'var(--spacing-xs) 0 0' }}>
                Use at least {MIN_PASSWORD_LENGTH} characters. Your account is stored only on this device.
              </p>
            </div>
          )}

          <label
            htmlFor="login-consent"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--spacing-sm)',
              fontSize: '0.8rem',
              marginBottom: 'var(--spacing-md)',
              cursor: 'pointer'
            }}
          >
            <input
              id="login-consent"
              name="consent"
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
            />
            <span>{CONSENT_LABEL}</span>
          </label>

          {error && (
            <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginBottom: 'var(--spacing-md)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy}
            style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}
          >
            {busy ? 'Please wait…' : isCreate ? 'Create Account' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
            {isCreate ? (
              <button
                type="button"
                onClick={() => switchMode('signIn')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-primary)',
                  fontSize: '0.85rem',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Already have an account? Sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('create')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-primary)',
                  fontSize: '0.85rem',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Create account
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
