import { useState, useEffect } from 'react';
import {
  RotateCcw,
  Save,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  HardDrive,
  RefreshCw,
  Shield,
  Eye
} from 'lucide-react';
import {
  recoveryManager,
  integrityVerifier,
  loggingSystem
} from '../core/security';
import type { RecoveryCheckpoint, RecoveryBackup, CrashLog } from '../core/security';

type Tab = 'overview' | 'checkpoints' | 'backups' | 'crashes';

export function RecoveryCenter() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [checkpoints, setCheckpoints] = useState<RecoveryCheckpoint[]>([]);
  const [backups, setBackups] = useState<RecoveryBackup[]>([]);
  const [crashLogs, setCrashLogs] = useState<CrashLog[]>([]);
  const [stats, setStats] = useState(recoveryManager.getRecoveryStats());
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);
  const [isRunningRecovery, setIsRunningRecovery] = useState(false);

  const refresh = () => {
    setCheckpoints(recoveryManager.getAllCheckpoints());
    setBackups(recoveryManager.getAllBackups());
    setCrashLogs(recoveryManager.getCrashLogs());
    setStats(recoveryManager.getRecoveryStats());
  };

  useEffect(() => { refresh(); }, []);

  const createCheckpoint = async () => {
    setIsCreatingCheckpoint(true);
    try {
      const workspaceData = localStorage.getItem('cipherforge-workspace') || '{}';
      recoveryManager.createCheckpoint('manual', {
        workspaceSnapshot: workspaceData
      });
      refresh();
    } catch (err) {
      loggingSystem.error('RecoveryCenter', 'Failed to create checkpoint', err instanceof Error ? err : undefined);
    } finally {
      setIsCreatingCheckpoint(false);
    }
  };

  const restoreCheckpoint = (id: string) => {
    if (!window.confirm('Restore this checkpoint? Current workspace will be replaced.')) return;
    const restored = recoveryManager.restoreCheckpoint(id);
    if (restored) {
      loggingSystem.info('RecoveryCenter', `Restored checkpoint: ${restored.id}`);
      refresh();
    }
  };

  const deleteCheckpoint = (id: string) => {
    if (!window.confirm('Delete this checkpoint permanently?')) return;
    recoveryManager.deleteCheckpoint(id);
    refresh();
  };

  const runRecovery = async () => {
    setIsRunningRecovery(true);
    try {
      await recoveryManager.runRecovery();
      refresh();
    } catch (err) {
      loggingSystem.error('RecoveryCenter', 'Recovery failed', err instanceof Error ? err : undefined);
    } finally {
      setIsRunningRecovery(false);
    }
  };

  const createBackup = async () => {
    const name = `backup-${new Date().toISOString().split('T')[0]}`;
    const data = localStorage.getItem('cipherforge-workspace') || '{}';
    await recoveryManager.createBackup(name, data, 'Manual backup');
    refresh();
  };

  const deleteBackup = (id: string) => {
    if (!window.confirm('Delete this backup permanently?')) return;
    recoveryManager.deleteBackup(id);
    refresh();
  };

  const formatDate = (d: Date) => new Date(d).toLocaleString();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Eye size={16} /> },
    { id: 'checkpoints', label: `Checkpoints (${checkpoints.length})`, icon: <Save size={16} /> },
    { id: 'backups', label: `Backups (${backups.length})`, icon: <HardDrive size={16} /> },
    { id: 'crashes', label: `Crash Logs (${crashLogs.length})`, icon: <AlertTriangle size={16} /> }
  ];

  return (
    <div className="animate-fadeIn" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <RotateCcw size={28} /> Recovery Center
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
            Manage checkpoints, backups, and crash recovery
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button className="btn btn-secondary" onClick={createBackup}>
            <Save size={16} /> Create Backup
          </button>
          <button className="btn btn-secondary" onClick={createCheckpoint} disabled={isCreatingCheckpoint}>
            <Clock size={16} /> {isCreatingCheckpoint ? 'Creating...' : 'New Checkpoint'}
          </button>
          <button className="btn btn-primary" onClick={runRecovery} disabled={isRunningRecovery}>
            <RefreshCw size={16} className={isRunningRecovery ? 'spin' : ''} />
            {isRunningRecovery ? 'Recovering...' : 'Run Recovery'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2px', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
              border: 'none', borderRadius: 'var(--border-radius-md) var(--border-radius-md) 0 0',
              cursor: 'pointer', fontSize: '0.875rem', fontWeight: activeTab === tab.id ? 600 : 400
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            {[
              { label: 'Checkpoints', value: stats.totalCheckpoints, icon: <Clock size={20} /> },
              { label: 'Backups', value: stats.totalBackups, icon: <HardDrive size={20} /> },
              { label: 'Crash Logs', value: stats.totalCrashes, icon: <AlertTriangle size={20} /> },
              { label: 'Integrity Checks', value: integrityVerifier.getAllChecksums().length, icon: <Shield size={20} /> }
            ].map(item => (
              <div key={item.label} style={{
                background: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)',
                padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'
              }}>
                <div style={{ color: 'var(--color-primary)' }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{item.value}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)', padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>Last Checkpoint</h3>
              {stats.lastCheckpoint ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{formatDate(stats.lastCheckpoint)}</p>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>No checkpoints yet</p>
              )}
            </div>
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)', padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>Last Backup</h3>
              {stats.lastBackup ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{formatDate(stats.lastBackup)}</p>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>No backups yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'checkpoints' && (
        <div>
          {checkpoints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
              <Clock size={48} style={{ opacity: 0.3, marginBottom: 'var(--spacing-md)' }} />
              <p>No checkpoints created yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {checkpoints.map(cp => (
                <div key={cp.id} style={{
                  background: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)',
                  padding: 'var(--spacing-md)', border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'
                }}>
                  <Clock size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{cp.type} Checkpoint</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {formatDate(cp.timestamp)} | {cp.size} bytes | {cp.isValid ? 'Valid' : 'Invalid'}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-secondary" onClick={() => restoreCheckpoint(cp.id)} title="Restore">
                    <RotateCcw size={14} />
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteCheckpoint(cp.id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'backups' && (
        <div>
          {backups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
              <HardDrive size={48} style={{ opacity: 0.3, marginBottom: 'var(--spacing-md)' }} />
              <p>No backups created yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {backups.map(bk => (
                <div key={bk.id} style={{
                  background: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)',
                  padding: 'var(--spacing-md)', border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'
                }}>
                  <HardDrive size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{bk.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {formatDate(bk.createdAt)} | {bk.size} bytes | {bk.description || 'No description'}
                    </div>
                    {bk.checksum && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        SHA-256: {bk.checksum.substring(0, 32)}...
                      </div>
                    )}
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteBackup(bk.id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'crashes' && (
        <div>
          {crashLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
              <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-md)' }} />
              <p>No crash logs recorded</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {crashLogs.map(log => (
                <div key={log.id} style={{
                  background: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)',
                  padding: 'var(--spacing-md)', border: '1px solid var(--color-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                    <AlertTriangle size={16} style={{ color: 'var(--color-error)' }} />
                    <span style={{ fontWeight: 500 }}>{log.error}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(log.timestamp)}
                    {log.lastOperation && ` | Last operation: ${log.lastOperation}`}
                  </div>
                  {log.stack && (
                    <pre style={{
                      marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-sm)',
                      background: 'var(--color-background)', borderRadius: 'var(--border-radius-sm)',
                      fontSize: '0.75rem', overflow: 'auto', maxHeight: '100px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {log.stack.substring(0, 500)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
