import { 
  Home, 
  Lock, 
  Unlock, 
  Search, 
  BarChart3, 
  BookOpen, 
  FileText, 
  Settings, 
  HelpCircle,
  History,
  Bookmark,
  Layers,
  Shield,
  Zap,
  Eye,
  RotateCcw,
  Activity
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  currentPage: string;
}

const menuItems = [
  { icon: Home, label: 'Dashboard', path: 'dashboard', shortcut: 'Ctrl+1' },
  { icon: Lock, label: 'Encrypt', path: 'workspace', shortcut: 'Ctrl+E' },
  { icon: Unlock, label: 'Decrypt', path: 'workspace', shortcut: 'Ctrl+D' },
  { icon: Zap, label: 'Brute Force', path: 'workspace', shortcut: 'Ctrl+B' },
  { icon: Search, label: 'Frequency Analysis', path: 'workspace', shortcut: 'Ctrl+F' },
  { icon: BarChart3, label: 'Visualizations', path: 'visualizations', shortcut: 'Ctrl+V' },
  { icon: Layers, label: 'Projects', path: 'projects' },
  { icon: History, label: 'History', path: 'history' },
  { icon: Bookmark, label: 'Bookmarks', path: 'bookmarks' },
  { icon: FileText, label: 'Reports', path: 'reports' },
  { icon: BookOpen, label: 'Learning', path: 'learning' },
  { icon: Eye, label: 'Privacy Center', path: 'privacy' },
  { icon: Shield, label: 'Security Audit', path: 'security' },
  { icon: RotateCcw, label: 'Recovery', path: 'recovery' },
  { icon: Activity, label: 'Diagnostics', path: 'diagnostics' },
  { icon: Settings, label: 'Settings', path: 'settings', shortcut: 'Ctrl+,' },
  { icon: HelpCircle, label: 'Help', path: 'help', shortcut: 'F1' }
];

export function Sidebar({ isOpen, onNavigate, currentPage }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside 
      className="sidebar"
      role="navigation"
      aria-label="Main navigation"
      style={{
        width: '260px',
        minWidth: '260px',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width var(--transition-normal)'
      }}
    >
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-sm)' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item, index) => (
            <li key={item.path + index} style={{ marginBottom: '2px' }}>
              <button
                onClick={() => onNavigate(item.path)}
                className="sidebar-item"
                aria-label={item.label}
                aria-current={currentPage === item.path ? 'page' : undefined}
                title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  width: '100%',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: currentPage === item.path ? 'var(--color-primary)' : 'transparent',
                  color: currentPage === item.path ? 'white' : 'var(--color-text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <item.icon size={18} aria-hidden="true" />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.shortcut && (
                  <span 
                    style={{ 
                      fontSize: '0.75rem', 
                      color: currentPage === item.path ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)',
                      opacity: 0.6
                    }}
                  >
                    {item.shortcut}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div 
        className="sidebar-footer"
        style={{
          padding: 'var(--spacing-md)',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <Shield size={14} />
          <span>CipherForge Pro v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
