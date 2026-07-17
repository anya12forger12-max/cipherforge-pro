import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Lock,
  Unlock,
  BarChart3,
  Settings,
  HelpCircle,
  FileText,
  Shield,
  Activity,
  RotateCcw,
  Eye,
  Zap,
  BookOpen,
  Command,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  shortcut?: string;
  action: () => void;
  keywords: string[];
}

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', description: 'Go to Dashboard', icon: <Command size={16} />, category: 'Navigation', shortcut: 'Ctrl+1', action: () => onNavigate('dashboard'), keywords: ['home', 'main', 'overview'] },
    { id: 'encrypt', label: 'Encrypt', description: 'Open Encryption Workspace', icon: <Lock size={16} />, category: 'Cipher', shortcut: 'Ctrl+E', action: () => onNavigate('workspace'), keywords: ['cipher', 'code', 'encode'] },
    { id: 'decrypt', label: 'Decrypt', description: 'Open Decryption Workspace', icon: <Unlock size={16} />, category: 'Cipher', shortcut: 'Ctrl+D', action: () => onNavigate('workspace'), keywords: ['decode', 'un_cipher'] },
    { id: 'brute', label: 'Brute Force', description: 'Brute Force Analysis', icon: <Zap size={16} />, category: 'Analysis', shortcut: 'Ctrl+B', action: () => onNavigate('workspace'), keywords: ['force', 'crack', 'all_shifts'] },
    { id: 'freq', label: 'Frequency Analysis', description: 'Character Frequency Analysis', icon: <BarChart3 size={16} />, category: 'Analysis', shortcut: 'Ctrl+F', action: () => onNavigate('workspace'), keywords: ['frequency', 'distribution', 'chi', 'statistics'] },
    { id: 'visualizations', label: 'Visualizations', description: 'Charts and Visualizations', icon: <BarChart3 size={16} />, category: 'Analysis', shortcut: 'Ctrl+V', action: () => onNavigate('visualizations'), keywords: ['charts', 'graphs', 'heatmap'] },
    { id: 'reports', label: 'Reports', description: 'Generate and View Reports', icon: <FileText size={16} />, category: 'Tools', action: () => onNavigate('reports'), keywords: ['export', 'pdf', 'document'] },
    { id: 'history', label: 'History', description: 'View Operation History', icon: <RotateCcw size={16} />, category: 'Tools', action: () => onNavigate('history'), keywords: ['past', 'previous', 'log'] },
    { id: 'learning', label: 'Learning Center', description: 'Educational Content', icon: <BookOpen size={16} />, category: 'Education', action: () => onNavigate('learning'), keywords: ['learn', 'tutorial', 'course', 'education'] },
    { id: 'privacy', label: 'Privacy Center', description: 'Privacy Settings and Controls', icon: <Eye size={16} />, category: 'Security', action: () => onNavigate('privacy'), keywords: ['privacy', 'data', 'erase', 'clipboard'] },
    { id: 'security', label: 'Security Audit', description: 'Run Security Audit', icon: <Shield size={16} />, category: 'Security', action: () => onNavigate('security'), keywords: ['security', 'audit', 'threat', 'vulnerability'] },
    { id: 'recovery', label: 'Recovery Center', description: 'Backup and Recovery', icon: <RotateCcw size={16} />, category: 'Security', action: () => onNavigate('recovery'), keywords: ['recovery', 'backup', 'checkpoint', 'restore'] },
    { id: 'diagnostics', label: 'Diagnostics', description: 'System Diagnostics', icon: <Activity size={16} />, category: 'System', action: () => onNavigate('diagnostics'), keywords: ['diagnostics', 'performance', 'system', 'health'] },
    { id: 'settings', label: 'Settings', description: 'Application Settings', icon: <Settings size={16} />, category: 'System', shortcut: 'Ctrl+,', action: () => onNavigate('settings'), keywords: ['config', 'preferences', 'options'] },
    { id: 'help', label: 'Help Center', description: 'Documentation and Help', icon: <HelpCircle size={16} />, category: 'System', shortcut: 'F1', action: () => onNavigate('help'), keywords: ['help', 'docs', 'documentation', 'guide'] },
  ];

  const fuzzyMatch = (item: CommandItem, query: string): number => {
    const q = query.toLowerCase();
    if (item.label.toLowerCase().includes(q)) return 100;
    if (item.description.toLowerCase().includes(q)) return 80;
    if (item.keywords.some(k => k.includes(q))) return 60;
    if (item.category.toLowerCase().includes(q)) return 40;
    let qi = 0;
    for (let i = 0; i < item.label.length && qi < q.length; i++) {
      if (item.label[i].toLowerCase() === q[qi]) qi++;
    }
    return qi === q.length ? 20 : 0;
  };

  const filtered = query
    ? commands
        .map(cmd => ({ cmd, score: fuzzyMatch(cmd, query) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ cmd }) => cmd)
    : commands;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeCommand = useCallback((cmd: CommandItem) => {
    cmd.action();
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      executeCommand(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered, selectedIndex, executeCommand, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const groupedCommands = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '560px',
          maxHeight: '450px',
          background: 'var(--color-surface)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-md)',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <Search size={18} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, settings, pages..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text)',
              fontSize: '1rem',
              fontFamily: 'var(--font-primary)'
            }}
            aria-label="Search commands"
            role="combobox"
            aria-expanded
            aria-controls="command-list"
          />
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '4px',
              display: 'flex'
            }}
            aria-label="Close command palette"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={listRef} id="command-list" role="listbox" style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-xs)' }}>
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {category}
              </div>
              {cmds.map(cmd => {
                const idx = filtered.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    role="option"
                    aria-selected={idx === selectedIndex}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      width: '100%',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      background: idx === selectedIndex ? 'var(--color-primary)' : 'transparent',
                      color: idx === selectedIndex ? 'white' : 'var(--color-text)',
                      border: 'none',
                      borderRadius: 'var(--border-radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem'
                    }}
                  >
                    <span style={{ opacity: idx === selectedIndex ? 1 : 0.6 }}>{cmd.icon}</span>
                    <span style={{ flex: 1, fontWeight: 500 }}>{cmd.label}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{cmd.description}</span>
                    {cmd.shortcut && (
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        background: idx === selectedIndex ? 'rgba(255,255,255,0.2)' : 'var(--color-border)',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No commands found for "{query}"
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.7rem',
          color: 'var(--color-text-secondary)'
        }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
          <span style={{ marginLeft: 'auto' }}>{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
}
