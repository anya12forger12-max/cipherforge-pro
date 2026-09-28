import { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

function hashPassword(password: string): string {
  let hash = 0;
  const salted = `cipherforge_login:${password}`;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSetup] = useState(() => !localStorage.getItem('cipherforge-login-hash'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isSetup) {
      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      localStorage.setItem('cipherforge-login-hash', hashPassword(password));
      onAuthenticated();
      return;
    }
    const stored = localStorage.getItem('cipherforge-login-hash');
    if (stored && stored === hashPassword(password)) {
      onAuthenticated();
      return;
    }
    setError('Incorrect password. Please try again.');
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
            {isSetup ? 'Set Up Your Password' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: 'var(--spacing-sm)' }}>
            {isSetup
              ? 'Create a password to secure your workspace.'
              : 'Enter your password to unlock CipherForge Pro.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  paddingRight: '40px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-background)',
                  color: 'var(--color-text)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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

          {isSetup && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-background)',
                  color: 'var(--color-text)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginBottom: 'var(--spacing-md)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}
          >
            {isSetup ? 'Set Password' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
