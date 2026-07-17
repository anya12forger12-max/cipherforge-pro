import { useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';

interface FrequencyData {
  letter: string;
  count: number;
  frequency: number;
  expectedFrequency: number;
}

export function Visualizations() {
  const [inputText, setInputText] = useState('');
  const [frequencyData, setFrequencyData] = useState<FrequencyData[]>([]);

  const analyzeFrequency = () => {
    const text = inputText.toUpperCase().replace(/[^A-Z]/g, '');
    const letterCounts = new Map<string, number>();
    
    for (const char of text) {
      letterCounts.set(char, (letterCounts.get(char) || 0) + 1);
    }

    const englishFrequencies: Record<string, number> = {
      'A': 0.082, 'B': 0.015, 'C': 0.028, 'D': 0.043, 'E': 0.127,
      'F': 0.022, 'G': 0.020, 'H': 0.061, 'I': 0.070, 'J': 0.002,
      'K': 0.008, 'L': 0.040, 'M': 0.024, 'N': 0.067, 'O': 0.075,
      'P': 0.019, 'Q': 0.001, 'R': 0.060, 'S': 0.063, 'T': 0.091,
      'U': 0.028, 'V': 0.010, 'W': 0.023, 'X': 0.001, 'Y': 0.020,
      'Z': 0.001
    };

    const total = text.length;
    const data: FrequencyData[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => ({
      letter,
      count: letterCounts.get(letter) || 0,
      frequency: total > 0 ? (letterCounts.get(letter) || 0) / total : 0,
      expectedFrequency: englishFrequencies[letter]
    }));

    setFrequencyData(data);
  };

  const getMaxFrequency = () => {
    if (frequencyData.length === 0) return 0.2;
    return Math.max(...frequencyData.map(d => Math.max(d.frequency, d.expectedFrequency))) * 1.2;
  };

  const maxFreq = getMaxFrequency();

  return (
    <div className="visualizations animate-fadeIn" role="region" aria-label="Visualizations">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
          Visualizations
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Analyze and visualize cipher data
        </p>
      </div>

      {/* Input Section */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: 'var(--spacing-md)' }}>
          Input Text
        </h2>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to analyze..."
          aria-label="Text to analyze"
          style={{
            width: '100%',
            minHeight: '120px',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            resize: 'vertical',
            marginBottom: 'var(--spacing-md)'
          }}
        />
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button onClick={analyzeFrequency} className="button button-primary">
            <BarChart3 size={16} />
            Analyze Frequency
          </button>
          <button 
            onClick={() => { setInputText(''); setFrequencyData([]); }}
            className="button button-secondary"
          >
            <RefreshCw size={16} />
            Clear
          </button>
        </div>
      </div>

      {/* Frequency Chart */}
      {frequencyData.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 500 }}>
              Letter Frequency Distribution
            </h2>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-primary)', borderRadius: '2px' }} />
                <span>Observed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-text-secondary)', borderRadius: '2px' }} />
                <span>Expected (English)</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '300px',
              padding: 'var(--spacing-md) 0',
              borderBottom: '1px solid var(--color-border)'
            }}
          >
            {frequencyData.map((data) => (
              <div
                key={data.letter}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  gap: 'var(--spacing-xs)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '250px',
                    width: '100%',
                    gap: '2px'
                  }}
                >
                  {/* Expected Frequency Bar */}
                  <div
                    style={{
                      width: '60%',
                      height: `${(data.expectedFrequency / maxFreq) * 100}%`,
                      backgroundColor: 'var(--color-text-secondary)',
                      opacity: 0.5,
                      borderRadius: '2px 2px 0 0',
                      transition: 'height var(--transition-normal)'
                    }}
                    title={`Expected: ${(data.expectedFrequency * 100).toFixed(1)}%`}
                  />
                  {/* Observed Frequency Bar */}
                  <div
                    style={{
                      width: '60%',
                      height: `${(data.frequency / maxFreq) * 100}%`,
                      backgroundColor: 'var(--color-primary)',
                      borderRadius: '2px 2px 0 0',
                      transition: 'height var(--transition-normal)'
                    }}
                    title={`Observed: ${(data.frequency * 100).toFixed(1)}%`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Letter Labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 'var(--spacing-sm)'
            }}
          >
            {frequencyData.map(data => (
              <div
                key={data.letter}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)'
                }}
              >
                {data.letter}
              </div>
            ))}
          </div>

          {/* Data Table */}
          <div style={{ marginTop: 'var(--spacing-lg)', overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Letter</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>Count</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>Observed %</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>Expected %</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>Difference</th>
                </tr>
              </thead>
              <tbody>
                {frequencyData
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 10)
                  .map(data => (
                    <tr
                      key={data.letter}
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <td style={{ padding: 'var(--spacing-sm)', fontWeight: 600 }}>
                        {data.letter}
                      </td>
                      <td style={{ padding: 'var(--spacing-sm)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {data.count}
                      </td>
                      <td style={{ padding: 'var(--spacing-sm)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {(data.frequency * 100).toFixed(2)}%
                      </td>
                      <td style={{ padding: 'var(--spacing-sm)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {(data.expectedFrequency * 100).toFixed(2)}%
                      </td>
                      <td
                        style={{
                          padding: 'var(--spacing-sm)',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          color: data.frequency > data.expectedFrequency ? 'var(--color-success)' : 'var(--color-error)'
                        }}
                      >
                        {((data.frequency - data.expectedFrequency) * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
