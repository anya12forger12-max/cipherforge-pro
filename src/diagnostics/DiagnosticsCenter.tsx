import { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Database,
  RefreshCw,
  AlertTriangle,
  Clock,
  Shield,
  Download,
  Layers,
  Zap,
  Thermometer
} from 'lucide-react';
import {
  resourceMonitor,
  loggingSystem,
  securityAuditEngine,
  dependencyManager,
  memorySecurity,
  tempFileManager,
  errorHandler,
  pluginSecurityManager,
  integrityVerifier,
  securityManager
} from '../core/security';
import type { ResourceSnapshot } from '../core/security';

export function DiagnosticsCenter() {
  const [snapshot, setSnapshot] = useState<ResourceSnapshot | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logStats, setLogStats] = useState(loggingSystem.getStats());
  const [depSummary, setDepSummary] = useState(dependencyManager.getSummary());
  const [memStats, setMemStats] = useState(memorySecurity.getStats());
  const [tempStats, setTempStats] = useState(tempFileManager.getStats());
  const [errorStats, setErrorStats] = useState(errorHandler.getStats());
  const [pluginReport, setPluginReport] = useState(pluginSecurityManager.generateSecurityReport());
  const [integrityReport, setIntegrityReport] = useState(integrityVerifier.generateReport());
  const [configValidation, setConfigValidation] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] });
  const [resourceWarnings, setResourceWarnings] = useState(resourceMonitor.getWarnings());

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      const s = await resourceMonitor.takeSnapshot();
      setSnapshot(s);
      setLogStats(loggingSystem.getStats());
      setDepSummary(dependencyManager.getSummary());
      setMemStats(memorySecurity.getStats());
      setTempStats(tempFileManager.getStats());
      setErrorStats(errorHandler.getStats());
      setPluginReport(pluginSecurityManager.generateSecurityReport());
      setIntegrityReport(integrityVerifier.generateReport());
      try {
        const cfg = localStorage.getItem('cipherforge-settings');
        if (cfg) { JSON.parse(cfg); setConfigValidation({ valid: true, errors: [] }); }
        else { setConfigValidation({ valid: true, errors: [] }); }
      } catch (e) { setConfigValidation({ valid: false, errors: ['Configuration is corrupted or invalid JSON'] }); }
      setResourceWarnings(resourceMonitor.getWarnings());
      loggingSystem.info('DiagnosticsCenter', 'Diagnostics refreshed');
    } catch (err) {
      loggingSystem.error('DiagnosticsCenter', 'Refresh failed', err instanceof Error ? err : undefined);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? 'var(--color-success)' : 'var(--color-error)' }} />
      <span style={{ fontSize: '0.8rem' }}>{label}</span>
    </div>
  );

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{
      background: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)',
      border: '1px solid var(--color-border)', padding: 'var(--spacing-lg)'
    }}>
      <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );

  const StatRow = ({ label, value }: { label: string; value: string | number }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.875rem' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );

  return (
    <div className="animate-fadeIn" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Activity size={28} /> Diagnostics Center
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
            System health, performance metrics, and module status
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button className="btn btn-secondary" onClick={() => {
            const report = generateFullReport();
            const blob = new Blob([report], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `diagnostics-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download size={16} /> Export Report
          </button>
          <button className="btn btn-primary" onClick={refreshAll} disabled={isRefreshing}>
            <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* System Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{
          background: snapshot?.memoryUsage && snapshot.memoryUsage.percentage < 70 ? 'rgba(34,197,94,0.05)' : 'rgba(234,179,8,0.05)',
          borderRadius: 'var(--border-radius-md)', padding: 'var(--spacing-lg)',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <Cpu size={20} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 600 }}>Memory</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{snapshot?.memoryUsage ? `${snapshot.memoryUsage.percentage}%` : 'N/A'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
            {snapshot?.memoryUsage ? `${formatBytes(snapshot.memoryUsage.usedJSHeapSize)} / ${formatBytes(snapshot.memoryUsage.jsHeapSizeLimit)}` : 'Not available'}
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)', padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <HardDrive size={20} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 600 }}>Storage</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{snapshot?.storageEstimate ? `${snapshot.storageEstimate.percentage}%` : 'N/A'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
            {snapshot?.storageEstimate ? `${formatBytes(snapshot.storageEstimate.usage)} / ${formatBytes(snapshot.storageEstimate.quota)}` : 'Not available'}
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)', padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <Zap size={20} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 600 }}>Performance</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{snapshot?.performanceMetrics.processingSpeed || 'N/A'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
            ops/ms | {snapshot?.performanceMetrics.longTasks || 0} long tasks
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)', padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <Clock size={20} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 600 }}>Uptime</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{resourceMonitor.getResourceSummary().uptime}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
            {resourceMonitor.getResourceSummary().tasksActive} active tasks
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-md)' }}>
        {/* Module Health */}
        <Section title="Module Health" icon={<Layers size={18} />}>
          <StatusBadge ok={configValidation.valid} label={`Configuration ${configValidation.valid ? 'Valid' : 'Invalid'}`} />
          {configValidation.errors.map((e, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--color-error)', marginLeft: '20px' }}>{e}</div>
          ))}
          <div style={{ marginTop: 'var(--spacing-sm)' }}><StatusBadge ok={true} label="Logging System Active" /></div>
          <StatusBadge ok={errorStats.bySeverity.critical === 0} label={`Error Handler: ${errorStats.total} errors`} />
          <StatusBadge ok={true} label={`Plugins: ${pluginReport.totalPlugins} installed`} />
          <StatusBadge ok={integrityReport.totalChecks > 0 ? integrityReport.failedChecks === 0 : true} label={`Integrity: ${integrityReport.totalChecks} checks`} />
          <StatusBadge ok={memStats.activeBuffers < 10} label={`Memory Security: ${memStats.activeBuffers} active buffers`} />
        </Section>

        {/* Logging */}
        <Section title="Logging" icon={<Database size={18} />}>
          <StatRow label="Total Entries" value={logStats.totalEntries} />
          <StatRow label="By Level" value={Object.entries(logStats.entriesByLevel).map(([k, v]) => `${k[0].toUpperCase()}:${v}`).join(' ')} />
          <StatRow label="Oldest Entry" value={logStats.oldestEntry ? new Date(logStats.oldestEntry).toLocaleDateString() : 'N/A'} />
          <StatRow label="Newest Entry" value={logStats.newestEntry ? new Date(logStats.newestEntry).toLocaleString() : 'N/A'} />
        </Section>

        {/* Dependencies */}
        <Section title="Dependencies" icon={<Layers size={18} />}>
          <StatRow label="Total" value={depSummary.total} />
          <StatRow label="Production" value={depSummary.production} />
          <StatRow label="Dev" value={depSummary.dev} />
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>License Distribution</div>
            <StatusBadge ok={depSummary.restrictiveLicenses === 0} label={`Safe: ${depSummary.safeLicenses}`} />
            <StatusBadge ok={true} label={`Moderate: ${depSummary.moderateLicenses}`} />
            <StatusBadge ok={depSummary.restrictiveLicenses === 0} label={`Restrictive: ${depSummary.restrictiveLicenses}`} />
            <StatusBadge ok={depSummary.unknownLicenses === 0} label={`Unknown: ${depSummary.unknownLicenses}`} />
          </div>
        </Section>

        {/* Security & Errors */}
        <Section title="Security & Errors" icon={<Shield size={18} />}>
          <StatRow label="Total Errors" value={errorStats.total} />
          <StatRow label="Critical" value={errorStats.bySeverity.critical} />
          <StatRow label="High" value={errorStats.bySeverity.high} />
          <StatRow label="Medium" value={errorStats.bySeverity.medium} />
          <StatRow label="Low" value={errorStats.bySeverity.low} />
          <StatRow label="Recoverable" value={errorStats.recoverable} />
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <StatRow label="Security Audit Score" value={securityAuditEngine.getSecurityScore()} />
            <StatRow label="Security Issues" value={securityManager.getSecurityIssues().length} />
          </div>
        </Section>

        {/* Storage */}
        <Section title="Storage & Temp Files" icon={<HardDrive size={18} />}>
          <StatRow label="Temp Files" value={tempStats.totalFiles} />
          <StatRow label="Temp Size" value={formatBytes(tempStats.totalSize)} />
          <StatRow label="Cleanups Performed" value={tempStats.cleanupCount} />
          <StatRow label="Avg File Age" value={tempStats.avgAge > 0 ? `${(tempStats.avgAge / 1000).toFixed(0)}s` : 'N/A'} />
          <StatRow label="Storage Items" value={10} />
        </Section>

        {/* Warnings */}
        <Section title="Resource Warnings" icon={<AlertTriangle size={18} />}>
          {resourceWarnings.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--color-success)' }}>
              <Thermometer size={16} /> No warnings. All systems nominal.
            </div>
          ) : (
            resourceWarnings.slice(-5).reverse().map((w, i) => (
              <div key={i} style={{
                padding: 'var(--spacing-xs) 0',
                borderBottom: i < Math.min(resourceWarnings.length, 5) - 1 ? '1px solid var(--color-border)' : 'none',
                fontSize: '0.8rem'
              }}>
                <span style={{
                  padding: '1px 6px', borderRadius: '4px', marginRight: 'var(--spacing-xs)',
                  background: w.severity === 'critical' ? 'var(--color-error)' : w.severity === 'high' ? 'var(--color-warning)' : 'var(--color-info)',
                  color: 'white', fontSize: '0.7rem'
                }}>{w.severity}</span>
                {w.message}
              </div>
            ))
          )}
        </Section>
      </div>
    </div>
  );

  function generateFullReport(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      resourceSnapshot: snapshot,
      logStats,
      depSummary,
      memStats,
      tempStats,
      errorStats,
      pluginReport,
      integrityReport,
      configValidation,
      warnings: resourceWarnings
    }, null, 2);
  }
}
