import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export function EducationalDisclaimer() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-label="Educational disclaimer"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)',
        backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, var(--color-surface))',
        border: '1px solid color-mix(in srgb, var(--color-warning) 30%, var(--color-border))',
        borderRadius: 'var(--border-radius-lg)'
      }}
    >
      <AlertTriangle 
        size={20} 
        style={{ 
          color: 'var(--color-warning)', 
          flexShrink: 0,
          marginTop: '2px'
        }} 
      />
      <div style={{ flex: 1 }}>
        <h3 
          style={{ 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            marginBottom: 'var(--spacing-xs)',
            color: 'var(--color-warning)'
          }}
        >
          Educational Disclaimer
        </h3>
        <p style={{ 
          fontSize: '0.875rem', 
          lineHeight: 1.5,
          color: 'var(--color-text)'
        }}>
          CipherForge Pro is an educational cryptography application. The Caesar Cipher is a historical 
          substitution cipher and is <strong>not secure</strong> for protecting confidential or sensitive 
          information. For real-world security, modern cryptographic algorithms such as AES-256, 
          ChaCha20-Poly1305, RSA, and Elliptic Curve Cryptography should be used.
        </p>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        aria-label="Dismiss disclaimer"
        style={{
          padding: 'var(--spacing-xs)',
          border: 'none',
          background: 'transparent',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          borderRadius: 'var(--border-radius-sm)',
          flexShrink: 0
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
