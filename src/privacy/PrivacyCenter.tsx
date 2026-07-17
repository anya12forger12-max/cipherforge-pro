import { useState, useEffect } from 'react';
import { 
  Shield, 
  Eye, 
  Trash2, 
  Download, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clipboard,
  Database,
  History
} from 'lucide-react';
import { privacyCenter } from '../core/security/privacyCenter';
import { recoveryManager } from '../core/security/recoveryManager';
import { resourceMonitor } from '../core/services/resourceMonitor';
import { clipboardSecurityManager } from '../core/security/clipboardSecurity';
import { securityAuditEngine } from '../core/security/auditEngine';

type PrivacyTab = 'overview' | 'data' | 'clipboard' | 'audit' | 'recovery';

export function PrivacyCenterPage() {
  const [activeTab, setActiveTab] = useState<PrivacyTab>('overview');
  const [privacyStatus, setPrivacyStatus] = useState(privacyCenter.getStatus());
  const [auditReport, setAuditReport] = useState<any>(null);
  const [resourceUsage, setResourceUsage] = useState(resourceMonitor.getCurrentUsage());
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setResourceUsage(resourceMonitor.getCurrentUsage());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const runAudit = async () => {
    setIsRunningAudit(true);
    const report = await securityAuditEngine.runFullAudit();
    setAuditReport(report);
    setIsRunningAudit(false);
  };

  const tabs = [
    { id: 'overview' as PrivacyTab, label: 'Overview', icon: Shield },
    { id: 'data' as PrivacyTab, label: 'Data & Privacy', icon: Database },
    { id: 'clipboard' as PrivacyTab, label: 'Clipboard', icon: Clipboard },
    { id: 'audit' as PrivacyTab, label: 'Security Audit', icon: Eye },
    { id: 'recovery' as PrivacyTab, label: 'Recovery', icon: RefreshCw }
  ];

  return (
    <div className="privacy-center animate-fadeIn" role="region" aria-label="Privacy Center">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
          Privacy & Security Center
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Manage your privacy settings, security, and data protection
        </p>
      </div>

      {/* Privacy Score Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-lg)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          borderRadius: 'var(--border-radius-lg)',
          color: 'white'
        }}
      >
        <div style={{ fontSize: '3rem', fontWeight: 700 }}>{privacyStatus.privacyScore}%</div>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
            Privacy Score
          </h2>
          <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>
            Your application is configured for optimal privacy protection
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Navigation */}
        <nav aria-label="Privacy navigation">
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

        {/* Content */}
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Security Overview
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                    <Database size={16} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Storage Used</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {resourceMonitor.formatBytes(privacyStatus.storageUsed)}
                  </div>
                </div>

                <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                    <History size={16} style={{ color: 'var(--color-warning)' }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>History Entries</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{privacyStatus.historyEntries}</div>
                </div>

                <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                    <Clipboard size={16} style={{ color: 'var(--color-info)' }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Memory Usage</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {resourceMonitor.formatBytes(resourceUsage.memory.usedJSHeapSize)}
                  </div>
                </div>
              </div>

              {/* Offline Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, var(--color-surface))',
                  border: '1px solid color-mix(in srgb, var(--color-success) 30%, var(--color-border))',
                  borderRadius: 'var(--border-radius-md)',
                  marginBottom: 'var(--spacing-md)'
                }}
              >
                <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>Offline Mode Active</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    All processing occurs locally. No data is sent to external servers.
                  </div>
                </div>
              </div>

              {/* Privacy Guarantees */}
              <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                  Privacy Guarantees
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {[
                    'No telemetry or analytics',
                    'No cloud APIs or remote services',
                    'No user accounts or subscriptions',
                    'No background tracking',
                    'No unnecessary permissions',
                    'All data stored locally only'
                  ].map((guarantee, index) => (
                    <li
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) 0',
                        borderBottom: '1px solid var(--color-border)'
                      }}
                    >
                      <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                      <span style={{ fontSize: '0.875rem' }}>{guarantee}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Data & Privacy Settings
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-md)', color: 'var(--color-primary)' }}>
                    Data Management
                  </h3>
                  <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                    <button
                      onClick={() => { privacyCenter.clearHistory(); setPrivacyStatus(privacyCenter.getStatus()); }}
                      className="button button-secondary"
                      style={{ justifyContent: 'flex-start' }}
                    >
                      <Trash2 size={16} />
                      Clear History
                    </button>
                    <button
                      onClick={() => { privacyCenter.clearCache(); setPrivacyStatus(privacyCenter.getStatus()); }}
                      className="button button-secondary"
                      style={{ justifyContent: 'flex-start' }}
                    >
                      <Trash2 size={16} />
                      Clear Cache
                    </button>
                    <button
                      onClick={() => { privacyCenter.clearTemporaryFiles(); setPrivacyStatus(privacyCenter.getStatus()); }}
                      className="button button-secondary"
                      style={{ justifyContent: 'flex-start' }}
                    >
                      <Trash2 size={16} />
                      Clear Temporary Files
                    </button>
                    <button
                      onClick={() => { privacyCenter.clearAllData(); setPrivacyStatus(privacyCenter.getStatus()); }}
                      className="button button-secondary"
                      style={{ justifyContent: 'flex-start', color: 'var(--color-error)' }}
                    >
                      <AlertTriangle size={16} />
                      Clear All Data
                    </button>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-md)', color: 'var(--color-primary)' }}>
                    Export Your Data
                  </h3>
                  <button
                    onClick={() => {
                      const data = privacyCenter.exportPersonalData();
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'cipherforge-privacy-data.json';
                      a.click();
                    }}
                    className="button button-secondary"
                  >
                    <Download size={16} />
                    Export Personal Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clipboard' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Clipboard Security
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div
                  style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'color-mix(in srgb, var(--color-info) 10%, var(--color-surface))',
                    border: '1px solid color-mix(in srgb, var(--color-info) 30%, var(--color-border))',
                    borderRadius: 'var(--border-radius-md)'
                  }}
                >
                  <p style={{ fontSize: '0.875rem' }}>
                    <strong>Security Note:</strong> Sensitive data copied to clipboard may remain accessible 
                    to other applications. Enable auto-clear for enhanced security.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={clipboardSecurityManager.getConfig().autoClearEnabled}
                      onChange={(e) => clipboardSecurityManager.updateConfig({ autoClearEnabled: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Enable clipboard auto-clear</span>
                  </label>
                </div>

                <div>
                  <label htmlFor="clipboard-delay" style={{ display: 'block', marginBottom: 'var(--spacing-sm)' }}>
                    Auto-clear delay (seconds)
                  </label>
                  <input
                    id="clipboard-delay"
                    type="number"
                    className="input"
                    min={5}
                    max={300}
                    value={clipboardSecurityManager.getConfig().autoClearDelay / 1000}
                    onChange={(e) => clipboardSecurityManager.updateConfig({ autoClearDelay: parseInt(e.target.value) * 1000 })}
                    style={{ width: '120px' }}
                  />
                </div>

                <button
                  onClick={() => clipboardSecurityManager.clearClipboard()}
                  className="button button-secondary"
                >
                  <Trash2 size={16} />
                  Clear Clipboard Now
                </button>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                  Security Audit
                </h2>
                <button
                  onClick={runAudit}
                  disabled={isRunningAudit}
                  className="button button-primary"
                >
                  {isRunningAudit ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Eye size={16} />
                      Run Audit
                    </>
                  )}
                </button>
              </div>

              {auditReport && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-lg)',
                      padding: 'var(--spacing-lg)',
                      marginBottom: 'var(--spacing-lg)',
                      backgroundColor: auditReport.overallScore >= 80 
                        ? 'color-mix(in srgb, var(--color-success) 10%, var(--color-surface))'
                        : 'color-mix(in srgb, var(--color-warning) 10%, var(--color-surface))',
                      border: `1px solid ${auditReport.overallScore >= 80 ? 'var(--color-success)' : 'var(--color-warning)'}`,
                      borderRadius: 'var(--border-radius-lg)'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                      {auditReport.overallScore}%
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>Security Score</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {auditReport.passedChecks} passed, {auditReport.failedChecks} failed, {auditReport.warningChecks} warnings
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                    {auditReport.checks.map((check: any) => (
                      <div
                        key={check.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 'var(--spacing-md)',
                          padding: 'var(--spacing-md)',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: 'var(--border-radius-md)'
                        }}
                      >
                        {check.status === 'passed' ? (
                          <CheckCircle size={18} style={{ color: 'var(--color-success)', marginTop: '2px' }} />
                        ) : check.status === 'failed' ? (
                          <AlertTriangle size={18} style={{ color: 'var(--color-error)', marginTop: '2px' }} />
                        ) : (
                          <AlertTriangle size={18} style={{ color: 'var(--color-warning)', marginTop: '2px' }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, marginBottom: '2px' }}>{check.name}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            {check.details}
                          </div>
                        </div>
                        <span className={`badge badge-${check.severity === 'high' ? 'error' : check.severity === 'medium' ? 'warning' : 'info'}`}>
                          {check.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recovery' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                Recovery Center
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                  <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{recoveryManager.getRecoveryStats().totalCheckpoints}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Checkpoints</div>
                  </div>
                  <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{recoveryManager.getRecoveryStats().totalBackups}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Backups</div>
                  </div>
                  <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{recoveryManager.getRecoveryStats().totalCrashes}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Crash Logs</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                  <button
                    onClick={() => recoveryManager.createCheckpoint('manual', {})}
                    className="button button-secondary"
                  >
                    <Database size={16} />
                    Create Recovery Checkpoint
                  </button>
                  <button
                    onClick={async () => { await recoveryManager.runRecovery(); }}
                    className="button button-secondary"
                  >
                    <RefreshCw size={16} />
                    Run Recovery Check
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
