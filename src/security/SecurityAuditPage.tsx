import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Download,
  Eye,
  Lock,
  FileText,
  ChevronDown,
  ChevronRight,
  Play
} from 'lucide-react';
import { 
  securityAuditEngine, 
  securityManager,
  resourceMonitor,
  dependencyManager,
  loggingSystem
} from '../core/security';
import type { AuditReport, AuditCheck } from '../core/security';

export function SecurityAuditPage() {
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const threatModel = securityManager.getThreatModel();
  const depSummary = dependencyManager.getSummary();
  const resourceSummary = resourceMonitor.getResourceSummary();

  useEffect(() => {
    const lastReport = securityAuditEngine.getLastReport();
    if (lastReport) setAuditReport(lastReport);
  }, []);

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const report = await securityAuditEngine.runFullAudit();
      setAuditReport(report);
    } catch (err) {
      loggingSystem.error('SecurityAuditPage', 'Audit failed', err instanceof Error ? err : undefined);
    } finally {
      setIsRunning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const getStatusIcon = (status: AuditCheck['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />;
      case 'warning': return <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />;
      case 'failed': return <XCircle size={16} style={{ color: 'var(--color-error)' }} />;
      case 'skipped': return <Eye size={16} style={{ color: 'var(--color-text-secondary)' }} />;
    }
  };

  const getSeverityColor = (severity: AuditCheck['severity']) => {
    switch (severity) {
      case 'critical': return 'var(--color-error)';
      case 'high': return 'var(--color-warning)';
      case 'medium': return 'var(--color-info)';
      case 'low': return 'var(--color-text-secondary)';
    }
  };

  const getChecksByCategory = (checks: AuditCheck[]) => {
    const grouped: Record<string, AuditCheck[]> = {};
    for (const check of checks) {
      if (!grouped[check.category]) grouped[check.category] = [];
      grouped[check.category].push(check);
    }
    return grouped;
  };

  const exportReport = () => {
    if (!auditReport) return;
    const blob = new Blob([JSON.stringify(auditReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const checksByCategory = auditReport ? getChecksByCategory(auditReport.checks) : {};

  return (
    <div className="animate-fadeIn" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Shield size={28} /> Security Audit Center
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
            Comprehensive security analysis and threat assessment
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button className="btn btn-secondary" onClick={exportReport} disabled={!auditReport}>
            <Download size={16} /> Export Report
          </button>
          <button className="btn btn-primary" onClick={runAudit} disabled={isRunning}>
            <RefreshCw size={16} className={isRunning ? 'spin' : ''} />
            {isRunning ? 'Running...' : 'Run Full Audit'}
          </button>
        </div>
      </div>

      <div style={{ 
        background: 'var(--color-warning)', 
        color: 'white', 
        padding: 'var(--spacing-md)', 
        borderRadius: 'var(--border-radius-md)',
        marginBottom: 'var(--spacing-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)'
      }}>
        <AlertTriangle size={20} />
        <span style={{ fontSize: '0.875rem' }}>
          <strong>Educational Notice:</strong> The Caesar Cipher is a historical substitution cipher intended solely for education. 
          It should never be used for real-world security.
        </span>
      </div>

      {auditReport ? (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 'var(--spacing-md)', 
            marginBottom: 'var(--spacing-lg)' 
          }}>
            <div style={{ 
              background: 'var(--color-surface)', 
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-lg)',
              textAlign: 'center',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: getScoreColor(auditReport.overallScore) }}>
                {auditReport.overallScore}
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Security Score</div>
            </div>
            <div style={{ 
              background: 'var(--color-surface)', 
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-lg)',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{auditReport.totalChecks}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Total Checks</div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--color-success)' }}>Pass: {auditReport.passedChecks}</span>
                <span style={{ color: 'var(--color-warning)' }}>Warn: {auditReport.warningChecks}</span>
                <span style={{ color: 'var(--color-error)' }}>Fail: {auditReport.failedChecks}</span>
              </div>
            </div>
            <div style={{ 
              background: 'var(--color-surface)', 
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-lg)',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{depSummary.total}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Dependencies</div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--color-success)' }}>Safe: {depSummary.safeLicenses}</span>
                <span style={{ color: 'var(--color-warning)' }}>Mod: {depSummary.moderateLicenses}</span>
              </div>
            </div>
            <div style={{ 
              background: 'var(--color-surface)', 
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-lg)',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>Memory: {resourceSummary.memoryMB} MB</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: 'var(--spacing-xs)' }}>
                Tasks: {resourceSummary.tasksActive} | Warnings: {resourceSummary.warningsCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-sm)' }}>
                Uptime: {resourceSummary.uptime}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ fontSize: 'var(--font-sizes.lg)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
              Audit Categories
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {Object.entries(checksByCategory).map(([category, checks]) => {
                const failed = checks.filter(c => c.status === 'failed').length;
                const warned = checks.filter(c => c.status === 'warning').length;
                const passed = checks.filter(c => c.status === 'passed').length;
                const score = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 100;

                return (
                  <div key={category} style={{ 
                    background: 'var(--color-surface)', 
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: 'var(--spacing-md)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--color-text)'
                      }}
                    >
                      {expandedCategory === category ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <span style={{ flex: 1, marginLeft: 'var(--spacing-sm)', fontWeight: 500 }}>{category}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginRight: 'var(--spacing-sm)' }}>
                        {passed} pass, {warned} warn, {failed} fail
                      </span>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem',
                        background: getScoreColor(score),
                        color: 'white'
                      }}>
                        {score}%
                      </span>
                    </button>
                    {expandedCategory === category && (
                      <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
                        {checks.map((check, idx) => (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: 'var(--spacing-sm)',
                            padding: 'var(--spacing-sm)',
                            borderBottom: idx < checks.length - 1 ? '1px solid var(--color-border)' : 'none'
                          }}>
                            {getStatusIcon(check.status)}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{check.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{check.description}</div>
                              {check.recommendation && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-info)', marginTop: '2px' }}>
                                  {check.recommendation}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
                              <span style={{ 
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: getSeverityColor(check.severity) + '20',
                                color: getSeverityColor(check.severity)
                              }}>
                                {check.severity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {auditReport.recommendations.length > 0 && (
            <div style={{ 
              background: 'var(--color-surface)', 
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--color-border)',
              padding: 'var(--spacing-lg)'
            }}>
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <FileText size={18} /> Recommendations
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {auditReport.recommendations.map((rec, idx) => (
                  <li key={idx} style={{ 
                    padding: 'var(--spacing-sm)', 
                    borderBottom: idx < auditReport.recommendations.length - 1 ? '1px solid var(--color-border)' : 'none',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                  }}>
                    <AlertTriangle size={14} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ 
            background: 'var(--color-surface)', 
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-border)',
            padding: 'var(--spacing-lg)',
            marginTop: 'var(--spacing-lg)'
          }}>
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <Lock size={18} /> Threat Model Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Assets</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{threatModel.assets.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Trust Boundaries</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{threatModel.trustBoundaries.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Data Flows</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{threatModel.dataFlows.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Known Threats</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{threatModel.threats.length}</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--spacing-2xl)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--color-border)'
        }}>
          <Play size={48} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }} />
          <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>No Audit Performed Yet</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
            Click "Run Full Audit" to analyze your security configuration
          </p>
          <button className="btn btn-primary" onClick={runAudit}>
            <Shield size={16} /> Run Full Audit
          </button>
        </div>
      )}
    </div>
  );
}
