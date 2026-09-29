import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  Moon, 
  Sun,
  Command,
  Maximize2,
  Minimize2,
  LogOut,
  UserRound
} from 'lucide-react';
import { useThemeStore } from '../../themes';
import { useState } from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenCommandPalette: () => void;
  /** Provided only while an account is signed in. */
  onSignOut?: () => void;
  signedInEmail?: string | null;
}

export function Header({ onToggleSidebar, onOpenCommandPalette, onSignOut, signedInEmail }: HeaderProps) {
  const { currentTheme, setTheme } = useThemeStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleTheme = () => {
    const newTheme = currentTheme.id === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <header 
      className="header"
      role="banner"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-sm) var(--spacing-lg)',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        height: '56px',
        minHeight: '56px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <button
          className="button-ghost"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar (Ctrl+B)"
          style={{
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--border-radius-md)',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--border-radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            }}
          >
            CF
          </div>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>CipherForge Pro</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <button
          className="button-ghost"
          onClick={onOpenCommandPalette}
          aria-label="Open command palette"
          title="Command Palette (Ctrl+P)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-background)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            minWidth: '200px'
          }}
        >
          <Search size={16} />
          <span>Search commands...</span>
          <span 
            style={{ 
              marginLeft: 'auto', 
              display: 'flex', 
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.75rem',
              opacity: 0.6
            }}
          >
            <Command size={12} />P
          </span>
        </button>

        <button
          className="button-ghost"
          onClick={toggleTheme}
          aria-label={`Switch to ${currentTheme.id === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${currentTheme.id === 'dark' ? 'light' : 'dark'} theme`}
          style={{
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--border-radius-md)',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {currentTheme.id === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="button-ghost"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          style={{
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--border-radius-md)',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <button
          className="button-ghost"
          aria-label="Notifications"
          title="Notifications"
          style={{
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--border-radius-md)',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <Bell size={18} />
          <span 
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-error)',
              border: '2px solid var(--color-surface)'
            }}
          />
        </button>

        {onSignOut && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span
              title={signedInEmail ? `Signed in as ${signedInEmail}` : 'Signed in'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                maxWidth: '160px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              <UserRound size={14} />
              {signedInEmail}
            </span>
            <button
              className="button-ghost"
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--border-radius-md)',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text)',
                cursor: 'pointer'
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}

        <button
          className="button-ghost"
          aria-label="Settings"
          title="Settings (Ctrl+,)"
          style={{
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--border-radius-md)',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
