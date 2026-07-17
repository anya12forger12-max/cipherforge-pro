import { useState } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Keyboard, 
  MessageCircle, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search
} from 'lucide-react';

type HelpTab = 'getting-started' | 'tutorials' | 'faq' | 'keyboard' | 'about';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'What is CipherForge Pro?',
    answer: 'CipherForge Pro is an advanced educational cryptography toolkit designed to teach users about classical ciphers, particularly the Caesar Cipher. It provides tools for encryption, decryption, frequency analysis, and brute force attacks.'
  },
  {
    question: 'Is the Caesar Cipher secure?',
    answer: 'No, the Caesar Cipher is a historical substitution cipher and is NOT secure for protecting sensitive information. It can be easily broken using brute force (only 25 possible keys) or frequency analysis. For real-world security, use modern algorithms like AES-256, RSA, or ChaCha20.'
  },
  {
    question: 'Can I use this for real encryption?',
    answer: 'CipherForge Pro is designed for educational purposes only. It should not be used to protect confidential or sensitive information. For secure encryption, use established libraries like OpenSSL, libsodium, or platform-specific cryptographic APIs.'
  },
  {
    question: 'How does frequency analysis work?',
    answer: 'Frequency analysis exploits the fact that certain letters appear more frequently in a language. In English, E, T, A, O, I, N are the most common letters. By analyzing the frequency of characters in ciphertext, we can deduce the shift used in a Caesar cipher.'
  },
  {
    question: 'What is brute force attack?',
    answer: 'A brute force attack tries all possible keys (shifts in the case of Caesar cipher) until the correct one is found. Since there are only 25 possible shifts, this is always possible with Caesar cipher.'
  },
  {
    question: 'Is my data sent to any servers?',
    answer: 'No. CipherForge Pro is an offline-first application. All processing happens locally on your device. No data is transmitted to external servers unless you explicitly enable optional features like update checking.'
  },
  {
    question: 'Can I use keyboard shortcuts?',
    answer: 'Yes! CipherForge Pro supports full keyboard navigation. Press Ctrl+P to open the Command Palette, or press F1 to view all available shortcuts.'
  },
  {
    question: 'How do I enable high contrast mode?',
    answer: 'Go to Settings > Appearance and select "High Contrast" from the theme dropdown. You can also enable it through the Command Palette by searching for "High Contrast".'
  }
];

const tutorials = [
  {
    id: 1,
    title: 'Getting Started with Caesar Cipher',
    description: 'Learn the basics of the Caesar cipher and how to encrypt/decrypt messages.',
    duration: '5 minutes',
    level: 'Beginner'
  },
  {
    id: 2,
    title: 'Understanding Frequency Analysis',
    description: 'Discover how letter frequencies can help break classical ciphers.',
    duration: '10 minutes',
    level: 'Intermediate'
  },
  {
    id: 3,
    title: 'Brute Force Techniques',
    description: 'Learn how to systematically try all possible keys to crack a cipher.',
    duration: '8 minutes',
    level: 'Beginner'
  },
  {
    id: 4,
    title: 'Advanced Cryptanalysis',
    description: 'Explore more sophisticated techniques for analyzing encrypted messages.',
    duration: '15 minutes',
    level: 'Advanced'
  }
];

export function HelpCenter() {
  const [activeTab, setActiveTab] = useState<HelpTab>('getting-started');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'getting-started' as HelpTab, label: 'Getting Started', icon: BookOpen },
    { id: 'tutorials' as HelpTab, label: 'Tutorials', icon: HelpCircle },
    { id: 'faq' as HelpTab, label: 'FAQ', icon: MessageCircle },
    { id: 'keyboard' as HelpTab, label: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'about' as HelpTab, label: 'About', icon: HelpCircle }
  ];

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="help-center animate-fadeIn" role="region" aria-label="Help center">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
          Help Center
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Learn how to use CipherForge Pro effectively
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Help Navigation */}
        <nav aria-label="Help navigation">
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

        {/* Help Content */}
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          {activeTab === 'getting-started' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Welcome to CipherForge Pro
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div
                  style={{
                    padding: 'var(--spacing-lg)',
                    backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, var(--color-surface))',
                    border: '1px solid color-mix(in srgb, var(--color-warning) 30%, var(--color-border))',
                    borderRadius: 'var(--border-radius-lg)'
                  }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: 'var(--color-warning)' }}>
                    Educational Purpose Only
                  </h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                    CipherForge Pro is designed for educational purposes to teach cryptographic concepts. 
                    The Caesar cipher and other classical ciphers are not secure for protecting sensitive information.
                  </p>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                    Quick Start
                  </h3>
                  <ol style={{ paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', lineHeight: 1.8 }}>
                    <li>Navigate to the <strong>Workspace</strong> from the sidebar</li>
                    <li>Enter your text in the input field</li>
                    <li>Choose your operation (Encrypt, Decrypt, Brute Force, or Frequency Analysis)</li>
                    <li>Set the shift value (for encryption/decryption)</li>
                    <li>Click the action button to process</li>
                    <li>View the results in the output panel</li>
                  </ol>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                    Key Features
                  </h3>
                  <ul style={{ paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', lineHeight: 1.8 }}>
                    <li><strong>Encryption/Decryption:</strong> Apply Caesar cipher with any shift value</li>
                    <li><strong>Brute Force:</strong> Try all possible shifts to find the correct one</li>
                    <li><strong>Frequency Analysis:</strong> Analyze letter frequencies to deduce the shift</li>
                    <li><strong>Visualizations:</strong> See frequency charts and analysis results</li>
                    <li><strong>Export:</strong> Save your work and analysis as reports</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tutorials' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Interactive Tutorials
              </h2>
              
              <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                {tutorials.map(tutorial => (
                  <div
                    key={tutorial.id}
                    className="card"
                    style={{
                      padding: 'var(--spacing-lg)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                          {tutorial.title}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                          {tutorial.description}
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            Duration: {tutorial.duration}
                          </span>
                          <span className={`badge badge-${tutorial.level === 'Beginner' ? 'success' : tutorial.level === 'Intermediate' ? 'warning' : 'error'}`}>
                            {tutorial.level}
                          </span>
                        </div>
                      </div>
                      <ExternalLink size={16} style={{ color: 'var(--color-text-secondary)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Frequently Asked Questions
              </h2>
              
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: 'var(--spacing-md)', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-secondary)'
                    }} 
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Search FAQ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {filteredFAQ.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--border-radius-md)',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: 'var(--spacing-md)',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                    >
                      <span>{item.question}</span>
                      {expandedFAQ === index ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {expandedFAQ === index && (
                      <div
                        style={{
                          padding: '0 var(--spacing-md) var(--spacing-md)',
                          fontSize: '0.875rem',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.6
                        }}
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'keyboard' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Keyboard Shortcuts Reference
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {[
                  {
                    category: 'Encryption',
                    shortcuts: [
                      { action: 'Encrypt text', keys: 'Ctrl + E' },
                      { action: 'Decrypt text', keys: 'Ctrl + D' },
                      { action: 'Brute force attack', keys: 'Ctrl + B' },
                      { action: 'Frequency analysis', keys: 'Ctrl + F' }
                    ]
                  },
                  {
                    category: 'File Operations',
                    shortcuts: [
                      { action: 'Open file', keys: 'Ctrl + O' },
                      { action: 'Open folder', keys: 'Ctrl + Shift + O' },
                      { action: 'Save', keys: 'Ctrl + S' },
                      { action: 'Export', keys: 'Ctrl + Shift + S' }
                    ]
                  },
                  {
                    category: 'Edit',
                    shortcuts: [
                      { action: 'Clear', keys: 'Ctrl + L' },
                      { action: 'Copy', keys: 'Ctrl + C' },
                      { action: 'Copy statistics', keys: 'Ctrl + Shift + C' }
                    ]
                  },
                  {
                    category: 'Application',
                    shortcuts: [
                      { action: 'Command palette', keys: 'Ctrl + P' },
                      { action: 'Toggle theme', keys: 'Ctrl + M' },
                      { action: 'Help', keys: 'F1' },
                      { action: 'Settings', keys: 'Ctrl + ,' },
                      { action: 'Cancel', keys: 'Escape' }
                    ]
                  }
                ].map((section, index) => (
                  <div key={index}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: 'var(--color-primary)' }}>
                      {section.category}
                    </h3>
                    <div style={{ display: 'grid', gap: '2px' }}>
                      {section.shortcuts.map((shortcut, shortcutIndex) => (
                        <div
                          key={shortcutIndex}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            backgroundColor: shortcutIndex % 2 === 0 ? 'var(--color-background)' : 'transparent',
                            borderRadius: 'var(--border-radius-sm)'
                          }}
                        >
                          <span style={{ fontSize: '0.875rem' }}>{shortcut.action}</span>
                          <kbd
                            style={{
                              padding: '2px 8px',
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--border-radius-sm)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.75rem'
                            }}
                          >
                            {shortcut.keys}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                About CipherForge Pro
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: 'var(--border-radius-xl)',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.5rem',
                      margin: '0 auto var(--spacing-md)'
                    }}
                  >
                    CF
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                    CipherForge Pro
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                    Version 1.0.0
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Advanced Educational Cryptography Toolkit
                  </p>
                </div>

                <div
                  style={{
                    padding: 'var(--spacing-lg)',
                    backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, var(--color-surface))',
                    border: '1px solid color-mix(in srgb, var(--color-warning) 30%, var(--color-border))',
                    borderRadius: 'var(--border-radius-lg)'
                  }}
                >
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: 'var(--color-warning)' }}>
                    Educational Disclaimer
                  </h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                    CipherForge Pro is an educational cryptography application. The Caesar Cipher is a historical 
                    substitution cipher and is <strong>not secure</strong> for protecting confidential or sensitive 
                    information. For real-world security, modern cryptographic algorithms such as AES-256, 
                    ChaCha20-Poly1305, RSA, and Elliptic Curve Cryptography should be used.
                  </p>
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                  <p>© 2024 CipherForge. For educational purposes only.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
