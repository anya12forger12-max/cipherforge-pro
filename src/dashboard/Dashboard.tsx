import { 
  Lock, 
  Unlock, 
  Search, 
  BarChart3, 
  BookOpen, 
  FileText, 
  Clock,
  Activity,
  Cpu,
  HardDrive
} from 'lucide-react';
import { useState } from 'react';

interface Widget {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  size: 'small' | 'medium' | 'large';
}

function QuickEncryptWidget() {
  const [text, setText] = useState('');
  const [shift, setShift] = useState(3);
  const [result, setResult] = useState('');

  const handleEncrypt = () => {
    const encrypted = text
      .toUpperCase()
      .split('')
      .map(char => {
        if (/[A-Z]/.test(char)) {
          return String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65);
        }
        return char;
      })
      .join('');
    setResult(encrypted);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <input
        type="text"
        className="input"
        placeholder="Enter text to encrypt..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Text to encrypt"
      />
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
        <label htmlFor="quick-shift" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Shift:
        </label>
        <input
          id="quick-shift"
          type="number"
          className="input"
          min={0}
          max={25}
          value={shift}
          onChange={(e) => setShift(parseInt(e.target.value) || 0)}
          style={{ width: '60px' }}
        />
        <button className="button button-primary" onClick={handleEncrypt}>
          <Lock size={14} />
          Encrypt
        </button>
      </div>
      {result && (
        <div 
          style={{ 
            padding: 'var(--spacing-sm)', 
            backgroundColor: 'var(--color-background)', 
            borderRadius: 'var(--border-radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            wordBreak: 'break-all'
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}

function QuickDecryptWidget() {
  const [text, setText] = useState('');
  const [shift, setShift] = useState(3);
  const [result, setResult] = useState('');

  const handleDecrypt = () => {
    const decrypted = text
      .toUpperCase()
      .split('')
      .map(char => {
        if (/[A-Z]/.test(char)) {
          return String.fromCharCode(((char.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
        }
        return char;
      })
      .join('');
    setResult(decrypted);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <input
        type="text"
        className="input"
        placeholder="Enter text to decrypt..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Text to decrypt"
      />
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
        <label htmlFor="quick-decrypt-shift" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Shift:
        </label>
        <input
          id="quick-decrypt-shift"
          type="number"
          className="input"
          min={0}
          max={25}
          value={shift}
          onChange={(e) => setShift(parseInt(e.target.value) || 0)}
          style={{ width: '60px' }}
        />
        <button className="button button-primary" onClick={handleDecrypt}>
          <Unlock size={14} />
          Decrypt
        </button>
      </div>
      {result && (
        <div 
          style={{ 
            padding: 'var(--spacing-sm)', 
            backgroundColor: 'var(--color-background)', 
            borderRadius: 'var(--border-radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            wordBreak: 'break-all'
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}

function StatisticsWidget() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-sm)' }}>
        <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius-md)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>12</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Projects</div>
        </div>
        <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius-md)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-success)' }}>48</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Encryptions</div>
        </div>
        <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius-md)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-warning)' }}>35</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Decryptions</div>
        </div>
        <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius-md)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-info)' }}>8</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Analyses</div>
        </div>
      </div>
    </div>
  );
}

function SystemStatusWidget() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <Activity size={16} style={{ color: 'var(--color-success)' }} />
        <span style={{ fontSize: '0.875rem' }}>Application: Running</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <Cpu size={16} style={{ color: 'var(--color-info)' }} />
        <span style={{ fontSize: '0.875rem' }}>CPU: 12%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <HardDrive size={16} style={{ color: 'var(--color-warning)' }} />
        <span style={{ fontSize: '0.875rem' }}>Memory: 256 MB</span>
      </div>
    </div>
  );
}

function LearningProgressWidget() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem' }}>Caesar Cipher Basics</span>
        <span className="badge badge-success">Completed</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem' }}>Frequency Analysis</span>
        <span className="badge badge-warning">In Progress</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem' }}>Brute Force Techniques</span>
        <span className="badge badge-info">Not Started</span>
      </div>
    </div>
  );
}

function RecentActivityWidget() {
  const activities = [
    { icon: <Lock size={14} />, text: 'Encrypted message with shift 7', time: '2 min ago' },
    { icon: <Unlock size={14} />, text: 'Decrypted ciphertext', time: '15 min ago' },
    { icon: <Search size={14} />, text: 'Performed frequency analysis', time: '1 hour ago' },
    { icon: <FileText size={14} />, text: 'Generated analysis report', time: '2 hours ago' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      {activities.map((activity, index) => (
        <div 
          key={index}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-xs)',
            fontSize: '0.875rem'
          }}
        >
          <span style={{ color: 'var(--color-primary)' }}>{activity.icon}</span>
          <span style={{ flex: 1 }}>{activity.text}</span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{activity.time}</span>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const widgets: Widget[] = [
    {
      id: 'quick-encrypt',
      title: 'Quick Encrypt',
      icon: <Lock size={18} />,
      component: <QuickEncryptWidget />,
      size: 'medium'
    },
    {
      id: 'quick-decrypt',
      title: 'Quick Decrypt',
      icon: <Unlock size={18} />,
      component: <QuickDecryptWidget />,
      size: 'medium'
    },
    {
      id: 'statistics',
      title: 'Statistics',
      icon: <BarChart3 size={18} />,
      component: <StatisticsWidget />,
      size: 'small'
    },
    {
      id: 'system-status',
      title: 'System Status',
      icon: <Activity size={18} />,
      component: <SystemStatusWidget />,
      size: 'small'
    },
    {
      id: 'learning-progress',
      title: 'Learning Progress',
      icon: <BookOpen size={18} />,
      component: <LearningProgressWidget />,
      size: 'small'
    },
    {
      id: 'recent-activity',
      title: 'Recent Activity',
      icon: <Clock size={18} />,
      component: <RecentActivityWidget />,
      size: 'medium'
    }
  ];

  return (
    <div className="dashboard animate-fadeIn" role="region" aria-label="Dashboard">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
          Welcome to CipherForge Pro
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Advanced Educational Cryptography Toolkit
        </p>
      </div>

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--spacing-lg)'
        }}
      >
        {widgets.map(widget => (
          <div 
            key={widget.id}
            className="card"
            style={{
              gridColumn: widget.size === 'large' ? 'span 2' : 'span 1'
            }}
          >
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
                paddingBottom: 'var(--spacing-sm)',
                borderBottom: '1px solid var(--color-border)'
              }}
            >
              <span style={{ color: 'var(--color-primary)' }}>{widget.icon}</span>
              <h2 style={{ fontSize: '1rem', fontWeight: 500 }}>{widget.title}</h2>
            </div>
            {widget.component}
          </div>
        ))}
      </div>
    </div>
  );
}
