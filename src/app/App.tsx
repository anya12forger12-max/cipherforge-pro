import { useState } from 'react';
import { useThemeStore } from '../themes';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from '../dashboard/Dashboard';
import { Workspace } from '../workspace/Workspace';
import { Settings } from '../configuration/Settings';
import { HelpCenter } from '../documentation/HelpCenter';
import { Visualizations } from '../visualization/Visualizations';
import { PrivacyCenterPage } from '../privacy/PrivacyCenter';
import { SecurityAuditPage } from '../security/SecurityAuditPage';
import { RecoveryCenter } from '../security/RecoveryCenter';
import { DiagnosticsCenter } from '../diagnostics/DiagnosticsCenter';
import { EducationalDisclaimer } from './components/EducationalDisclaimer';
import { NotificationPanel } from './components/NotificationPanel';
import { CommandPalette } from './components/CommandPalette';
import { StatusBar } from './components/StatusBar';
import { FirstLaunchWizard } from './components/FirstLaunchWizard';
import { LoginScreen } from './components/LoginScreen';
import './App.css';

type Page = 'dashboard' | 'workspace' | 'settings' | 'help' | 'visualizations' | 'projects' | 'history' | 'bookmarks' | 'reports' | 'learning' | 'security' | 'privacy' | 'recovery' | 'diagnostics';

function App() {
  const { currentTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [wizardOpen, setWizardOpen] = useState(() => !localStorage.getItem('cipherforge-onboarded'));
  const [authenticated, setAuthenticated] = useState(false);

  const themeStyles = {
    '--color-primary': currentTheme.colors.primary,
    '--color-secondary': currentTheme.colors.secondary,
    '--color-background': currentTheme.colors.background,
    '--color-surface': currentTheme.colors.surface,
    '--color-text': currentTheme.colors.text,
    '--color-text-secondary': currentTheme.colors.textSecondary,
    '--color-border': currentTheme.colors.border,
    '--color-success': currentTheme.colors.success,
    '--color-warning': currentTheme.colors.warning,
    '--color-error': currentTheme.colors.error,
    '--color-info': currentTheme.colors.info,
    '--color-accent': currentTheme.colors.accent,
    '--font-primary': currentTheme.fonts.primary,
    '--font-secondary': currentTheme.fonts.secondary,
    '--font-mono': currentTheme.fonts.mono,
    '--spacing-xs': currentTheme.spacing.xs,
    '--spacing-sm': currentTheme.spacing.sm,
    '--spacing-md': currentTheme.spacing.md,
    '--spacing-lg': currentTheme.spacing.lg,
    '--spacing-xl': currentTheme.spacing.xl,
    '--spacing-2xl': currentTheme.spacing['2xl']
  } as React.CSSProperties;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'workspace':
        return <Workspace />;
      case 'settings':
        return <Settings />;
      case 'help':
        return <HelpCenter />;
      case 'visualizations':
        return <Visualizations />;
      case 'privacy':
        return <PrivacyCenterPage />;
      case 'projects':
        return (
          <div className="animate-fadeIn">
            <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
              Projects
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Project management coming soon...</p>
          </div>
        );
      case 'history':
        return (
          <div className="animate-fadeIn">
            <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
              History
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>History tracking coming soon...</p>
          </div>
        );
      case 'bookmarks':
        return (
          <div className="animate-fadeIn">
            <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
              Bookmarks
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Bookmark management coming soon...</p>
          </div>
        );
      case 'reports':
        return (
          <div className="animate-fadeIn">
            <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
              Reports
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Report generation coming soon...</p>
          </div>
        );
      case 'learning':
        return (
          <div className="animate-fadeIn">
            <h1 style={{ fontSize: 'var(--font-sizes.xl)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
              Learning Center
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Educational content coming soon...</p>
          </div>
        );
      case 'security':
        return <SecurityAuditPage />;
      case 'recovery':
        return <RecoveryCenter />;
      case 'diagnostics':
        return <DiagnosticsCenter />;
      default:
        return <Dashboard />;
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  return (
    <div 
      className="app-container"
      style={themeStyles}
      data-theme={currentTheme.id}
    >
      <Header 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />
      
      <div className="app-layout">
        <Sidebar isOpen={sidebarOpen} onNavigate={handleNavigate} currentPage={currentPage} />
        
        <main className="main-content" role="main" aria-label="Main content">
          {currentPage === 'dashboard' && <EducationalDisclaimer />}
          {renderPage()}
        </main>
      </div>

      <NotificationPanel />

      {commandPaletteOpen && (
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onNavigate={handleNavigate}
        />
      )}

      <StatusBar currentPage={currentPage} isOffline={true} />

      {!authenticated && (
        <LoginScreen onAuthenticated={() => setAuthenticated(true)} />
      )}

      <FirstLaunchWizard
        isOpen={wizardOpen && authenticated}
        onComplete={() => setWizardOpen(false)}
        onSkip={() => { localStorage.setItem('cipherforge-onboarded', 'true'); setWizardOpen(false); }}
      />
    </div>
  );
}

export default App;
