import { create } from 'zustand';
import type { Theme, ThemeColors } from '../core/types';

const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    info: '#3b82f6',
    accent: '#06b6d4'
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  }
};

const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  colors: {
    primary: '#4f46e5',
    secondary: '#7c3aed',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    success: '#16a34a',
    warning: '#ca8a04',
    error: '#dc2626',
    info: '#2563eb',
    accent: '#0891b2'
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  }
};

const highContrastTheme: Theme = {
  id: 'high-contrast',
  name: 'High Contrast',
  colors: {
    primary: '#0000ff',
    secondary: '#800080',
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#ffff00',
    border: '#ffffff',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff',
    accent: '#ff00ff'
  },
  fonts: {
    primary: 'Arial, sans-serif',
    secondary: 'Arial, sans-serif',
    mono: 'Courier New, monospace',
    sizes: {
      xs: '0.875rem',
      sm: '1rem',
      base: '1.125rem',
      lg: '1.25rem',
      xl: '1.375rem',
      '2xl': '1.75rem',
      '3xl': '2.125rem'
    }
  },
  spacing: {
    xs: '0.375rem',
    sm: '0.625rem',
    md: '1.125rem',
    lg: '1.75rem',
    xl: '2.25rem',
    '2xl': '3.5rem'
  }
};

const cyberGreenTheme: Theme = {
  id: 'cyber-green',
  name: 'Cyber Green',
  colors: {
    primary: '#00ff41',
    secondary: '#00cc33',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    text: '#00ff41',
    textSecondary: '#00cc33',
    border: '#00ff41',
    success: '#00ff41',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff',
    accent: '#00ff41'
  },
  fonts: {
    primary: 'JetBrains Mono, monospace',
    secondary: 'JetBrains Mono, monospace',
    mono: 'JetBrains Mono, monospace',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  }
};

const midnightBlueTheme: Theme = {
  id: 'midnight-blue',
  name: 'Midnight Blue',
  colors: {
    primary: '#1e40af',
    secondary: '#3b82f6',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    border: '#334155',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    info: '#3b82f6',
    accent: '#60a5fa'
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  }
};

const professionalGrayTheme: Theme = {
  id: 'professional-gray',
  name: 'Professional Gray',
  colors: {
    primary: '#6b7280',
    secondary: '#9ca3af',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
    accent: '#6366f1'
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  }
};

const colorBlindFriendlyTheme: Theme = {
  id: 'color-blind-friendly',
  name: 'Color Blind Friendly',
  colors: {
    primary: '#0077bb',
    secondary: '#33bbee',
    background: '#ffffff',
    surface: '#f7f7f7',
    text: '#000000',
    textSecondary: '#555555',
    border: '#cccccc',
    success: '#009988',
    warning: '#ee7733',
    error: '#cc3311',
    info: '#0077bb',
    accent: '#ee3377'
  },
  fonts: {
    primary: 'Arial, sans-serif',
    secondary: 'Arial, sans-serif',
    mono: 'Courier New, monospace',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  }
};

export const themes: Theme[] = [
  darkTheme,
  lightTheme,
  highContrastTheme,
  cyberGreenTheme,
  midnightBlueTheme,
  professionalGrayTheme,
  colorBlindFriendlyTheme
];

interface ThemeState {
  currentTheme: Theme;
  themes: Theme[];
  setTheme: (themeId: string) => void;
  getThemeById: (id: string) => Theme | undefined;
  getThemeColors: () => ThemeColors;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: darkTheme,
  themes,
  setTheme: (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      set({ currentTheme: theme });
      localStorage.setItem('cipherforge-theme', themeId);
    }
  },
  getThemeById: (id: string) => themes.find(t => t.id === id),
  getThemeColors: () => get().currentTheme.colors
}));

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('cipherforge-theme');
if (savedTheme) {
  const theme = themes.find(t => t.id === savedTheme);
  if (theme) {
    useThemeStore.getState().setTheme(savedTheme);
  }
}
