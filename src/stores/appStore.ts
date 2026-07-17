import { create } from 'zustand';
import type { 
  CipherResult, 
  AnalysisResult, 
  Project, 
  Notification, 
  KeyboardShortcut 
} from '../core/types';

interface AppState {
  // Current cipher operations
  currentInput: string;
  currentOutput: string;
  currentShift: number;
  isProcessing: boolean;

  // History
  history: CipherResult[];
  addToHistory: (result: CipherResult) => void;
  clearHistory: () => void;

  // Projects
  projects: Project[];
  currentProject: Project | null;
  addProject: (project: Project) => void;
  setCurrentProject: (project: Project | null) => void;

  // Analysis
  currentAnalysis: AnalysisResult | null;
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Keyboard shortcuts
  shortcuts: KeyboardShortcut[];
  updateShortcut: (id: string, shortcut: Partial<KeyboardShortcut>) => void;

  // Actions
  setCurrentInput: (input: string) => void;
  setCurrentOutput: (output: string) => void;
  setCurrentShift: (shift: number) => void;
  setIsProcessing: (processing: boolean) => void;
}

export const useAppStore = create<AppState>((set, _get) => ({
  // Current cipher operations
  currentInput: '',
  currentOutput: '',
  currentShift: 3,
  isProcessing: false,

  // History
  history: [],
  addToHistory: (result) => set((state) => ({
    history: [result, ...state.history].slice(0, 100) // Keep last 100 items
  })),
  clearHistory: () => set({ history: [] }),

  // Projects
  projects: [],
  currentProject: null,
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project]
  })),
  setCurrentProject: (project) => set({ currentProject: project }),

  // Analysis
  currentAnalysis: null,
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),

  // Notifications
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        read: false
      },
      ...state.notifications
    ].slice(0, 50) // Keep last 50 notifications
  })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
  })),
  clearNotifications: () => set({ notifications: [] }),

  // UI State
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Keyboard shortcuts
  shortcuts: [
    { id: 'encrypt', key: 'E', modifiers: ['Ctrl'], action: 'encrypt', description: 'Encrypt text', category: 'Encryption' },
    { id: 'decrypt', key: 'D', modifiers: ['Ctrl'], action: 'decrypt', description: 'Decrypt text', category: 'Encryption' },
    { id: 'brute-force', key: 'B', modifiers: ['Ctrl'], action: 'brute-force', description: 'Brute force attack', category: 'Analysis' },
    { id: 'frequency', key: 'F', modifiers: ['Ctrl'], action: 'frequency', description: 'Frequency analysis', category: 'Analysis' },
    { id: 'open-file', key: 'O', modifiers: ['Ctrl'], action: 'open-file', description: 'Open file', category: 'File' },
    { id: 'save', key: 'S', modifiers: ['Ctrl'], action: 'save', description: 'Save', category: 'File' },
    { id: 'export', key: 'S', modifiers: ['Ctrl', 'Shift'], action: 'export', description: 'Export', category: 'File' },
    { id: 'clear', key: 'L', modifiers: ['Ctrl'], action: 'clear', description: 'Clear', category: 'Edit' },
    { id: 'copy', key: 'C', modifiers: ['Ctrl'], action: 'copy', description: 'Copy', category: 'Edit' },
    { id: 'command-palette', key: 'P', modifiers: ['Ctrl'], action: 'command-palette', description: 'Command Palette', category: 'Application' },
    { id: 'help', key: 'F1', modifiers: [], action: 'help', description: 'Help', category: 'Application' },
    { id: 'settings', key: ',', modifiers: ['Ctrl'], action: 'settings', description: 'Settings', category: 'Application' }
  ],
  updateShortcut: (id, shortcut) => set((state) => ({
    shortcuts: state.shortcuts.map(s =>
      s.id === id ? { ...s, ...shortcut } : s
    )
  })),

  // Actions
  setCurrentInput: (input) => set({ currentInput: input }),
  setCurrentOutput: (output) => set({ currentOutput: output }),
  setCurrentShift: (shift) => set({ currentShift: shift }),
  setIsProcessing: (processing) => set({ isProcessing: processing })
}));
