import { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Zap, 
  Copy, 
  Download, 
  RefreshCw,
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';

type TabType = 'encrypt' | 'decrypt' | 'brute-force' | 'frequency';

export function Workspace() {
  const [activeTab, setActiveTab] = useState<TabType>('encrypt');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [shift, setShift] = useState(3);
  const [bruteForceResults, setBruteForceResults] = useState<Array<{shift: number; text: string; score: number}>>([]);
  const { addToHistory } = useAppStore();

  const encrypt = () => {
    const result = input
      .toUpperCase()
      .split('')
      .map(char => {
        if (/[A-Z]/.test(char)) {
          return String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65);
        }
        return char;
      })
      .join('');
    setOutput(result);
    addToHistory({
      ciphertext: result,
      plaintext: input.toUpperCase(),
      shift,
      confidence: 1.0,
      method: 'Caesar Cipher (Encrypt)',
      timestamp: new Date(),
      duration: 0
    });
  };

  const decrypt = () => {
    const result = input
      .toUpperCase()
      .split('')
      .map(char => {
        if (/[A-Z]/.test(char)) {
          return String.fromCharCode(((char.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
        }
        return char;
      })
      .join('');
    setOutput(result);
    addToHistory({
      ciphertext: input.toUpperCase(),
      plaintext: result,
      shift,
      confidence: 1.0,
      method: 'Caesar Cipher (Decrypt)',
      timestamp: new Date(),
      duration: 0
    });
  };

  const bruteForce = () => {
    const results = [];
    for (let s = 0; s < 26; s++) {
      const decrypted = input
        .toUpperCase()
        .split('')
        .map(char => {
          if (/[A-Z]/.test(char)) {
            return String.fromCharCode(((char.charCodeAt(0) - 65 - s + 26) % 26) + 65);
          }
          return char;
        })
        .join('');
      
      // Simple scoring based on common English words
      const commonWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT'];
      const words = decrypted.split(/\s+/);
      let score = 0;
      for (const word of words) {
        if (commonWords.includes(word)) {
          score += 10;
        }
      }
      score += Math.random() * 5; // Add some variation
      
      results.push({ shift: s, text: decrypted, score });
    }
    setBruteForceResults(results.sort((a, b) => b.score - a.score));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: 'encrypt' as TabType, label: 'Encrypt', icon: Lock },
    { id: 'decrypt' as TabType, label: 'Decrypt', icon: Unlock },
    { id: 'brute-force' as TabType, label: 'Brute Force', icon: Zap },
    { id: 'frequency' as TabType, label: 'Frequency Analysis', icon: ArrowRightLeft }
  ];

  return (
    <div className="workspace animate-fadeIn" role="region" aria-label="Cipher workspace">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
          Cipher Workspace
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Encrypt, decrypt, and analyze text using Caesar cipher
        </p>
      </div>

      {/* Educational Warning */}
      <div
        role="alert"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
          backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, var(--color-surface))',
          border: '1px solid color-mix(in srgb, var(--color-warning) 30%, var(--color-border))',
          borderRadius: 'var(--border-radius-lg)'
        }}
      >
        <AlertTriangle size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
          <strong>Educational Mode:</strong> The Caesar cipher is a historical algorithm and not secure for real-world use.
        </p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Cipher operations"
        style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--spacing-sm)'
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all var(--transition-fast)'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={activeTab}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-lg)'
        }}
      >
        {/* Input Panel */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-md)'
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 500 }}>Input</h2>
            <button
              onClick={() => copyToClipboard(input)}
              className="button button-ghost"
              style={{ padding: 'var(--spacing-xs)' }}
              aria-label="Copy input"
            >
              <Copy size={16} />
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your text here..."
            aria-label="Input text"
            style={{
              width: '100%',
              minHeight: '200px',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              resize: 'vertical',
              lineHeight: 1.6
            }}
          />
        </div>

        {/* Output Panel */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-md)'
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 500 }}>Output</h2>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                onClick={() => copyToClipboard(output)}
                className="button button-ghost"
                style={{ padding: 'var(--spacing-xs)' }}
                aria-label="Copy output"
              >
                <Copy size={16} />
              </button>
              <button
                className="button button-ghost"
                style={{ padding: 'var(--spacing-xs)' }}
                aria-label="Download output"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
          <div
            style={{
              width: '100%',
              minHeight: '200px',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
          >
            {output || 'Output will appear here...'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          marginTop: 'var(--spacing-lg)',
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <label htmlFor="shift-value" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Shift Value:
          </label>
          <input
            id="shift-value"
            type="number"
            className="input"
            min={0}
            max={25}
            value={shift}
            onChange={(e) => setShift(parseInt(e.target.value) || 0)}
            style={{ width: '80px' }}
          />
          <input
            type="range"
            min={0}
            max={25}
            value={shift}
            onChange={(e) => setShift(parseInt(e.target.value))}
            aria-label="Shift slider"
            style={{ width: '150px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginLeft: 'auto' }}>
          {activeTab === 'encrypt' && (
            <button onClick={encrypt} className="button button-primary">
              <Lock size={16} />
              Encrypt
            </button>
          )}
          {activeTab === 'decrypt' && (
            <button onClick={decrypt} className="button button-primary">
              <Unlock size={16} />
              Decrypt
            </button>
          )}
          {activeTab === 'brute-force' && (
            <button onClick={bruteForce} className="button button-primary">
              <Zap size={16} />
              Brute Force
            </button>
          )}
          <button
            onClick={() => { setInput(''); setOutput(''); }}
            className="button button-secondary"
          >
            <RefreshCw size={16} />
            Clear
          </button>
        </div>
      </div>

      {/* Brute Force Results */}
      {activeTab === 'brute-force' && bruteForceResults.length > 0 && (
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: 'var(--spacing-md)' }}>
            Brute Force Results
          </h2>
          <div
            style={{
              display: 'grid',
              gap: 'var(--spacing-sm)',
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            {bruteForceResults.slice(0, 10).map((result, index) => (
              <div
                key={result.shift}
                className="card"
                style={{
                  padding: 'var(--spacing-md)',
                  cursor: 'pointer',
                  backgroundColor: index === 0 ? 'color-mix(in srgb, var(--color-success) 10%, var(--color-surface))' : undefined
                }}
                onClick={() => setOutput(result.text)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ fontWeight: 500 }}>Shift: {result.shift}</span>
                  <span className="badge badge-info">Score: {result.score.toFixed(2)}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {result.text.substring(0, 100)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
