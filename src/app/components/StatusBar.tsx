import { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Shield,
  Clock,
  Cpu,
  HardDrive,
  Lock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { resourceMonitor } from '../../core/security/resourceMonitor';

interface StatusBarProps {
  currentPage: string;
  isOffline?: boolean;
}

export function StatusBar({ currentPage, isOffline = true }: StatusBarProps) {
  const [memPct, setMemPct] = useState<number | null>(null);
  const [uptime, setUptime] = useState('0s');
  const [warnings, setWarnings] = useState(0);

  useEffect(() => {
    const update = () => {
      const snap = resourceMonitor.getCurrentSnapshot();
      if (snap?.memoryUsage) setMemPct(snap.memoryUsage.percentage);
      const summary = resourceMonitor.getResourceSummary();
      setUptime(summary.uptime);
      setWarnings(summary.warningsCount);
    };
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, []);

  const modeLabel: Record<string, string> = {
    dashboard: 'Dashboard',
    workspace: 'Cipher Workspace',
    encrypt: 'Encrypt',
    decrypt: 'Decrypt',
    visualizations: 'Visualizations',
    settings: 'Settings',
    help: 'Help',
    privacy: 'Privacy Center',
    security: 'Security Audit',
    recovery: 'Recovery Center',
    diagnostics: 'Diagnostics',
    history: 'History',
    bookmarks: 'Bookmarks',
    reports: 'Reports',
    learning: 'Learning Center',
    projects: 'Projects'
  };

  return (
    <footer
      className="status-bar"
      role="status"
      aria-label="Application status"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '28px',
        padding: '0 var(--spacing-md)',
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        fontSize: '0.7rem',
        borderTop: '1px solid var(--color-border)',
        userSelect: 'none',
        gap: 'var(--spacing-md)',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
          <Shield size={12} />
          {modeLabel[currentPage] || currentPage}
        </span>
        <span style={{ opacity: 0.7 }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Lock size={11} />
          Offline-First
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        {memPct !== null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={11} />
            {memPct}% RAM
          </span>
        )}

        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HardDrive size={11} />
          v1.0.0
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} />
          {uptime}
        </span>

        {warnings > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
            <AlertTriangle size={11} />
            {warnings}
          </span>
        )}

        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isOffline ? (
            <>
              <WifiOff size={11} />
              Offline
            </>
          ) : (
            <>
              <Wifi size={11} />
              Online
            </>
          )}
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle size={11} />
          WCAG AAA
        </span>
      </div>
    </footer>
  );
}
