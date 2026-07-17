export interface CipherResult {
  ciphertext: string;
  plaintext: string;
  shift: number;
  confidence: number;
  method: string;
  timestamp: Date;
  duration: number;
}

export interface AnalysisResult {
  type: 'frequency' | 'brute-force' | 'pattern' | 'index-of-coincidence';
  data: FrequencyData | BruteForceResult[] | PatternData | IoCResult;
  confidence: number;
  timestamp: Date;
}

export interface FrequencyData {
  letterFrequencies: Map<string, number>;
  expectedFrequencies: Map<string, number>;
  chiSquared: number;
  correlation: number;
  topShifts: number[];
}

export interface BruteForceResult {
  shift: number;
  plaintext: string;
  score: number;
  chiSquared: number;
  wordMatches: number;
}

export interface PatternData {
  patterns: string[];
  repeats: Map<string, number>;
  suggestions: string[];
}

export interface IoCResult {
  value: number;
  englishAverage: number;
  deviation: number;
  likelyEncrypted: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  files: ProjectFile[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  type: 'ciphertext' | 'plaintext' | 'analysis' | 'report';
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  projectId: string;
  title: string;
  content: string;
  sections: ReportSection[];
  generatedAt: Date;
  format: 'html' | 'pdf' | 'markdown' | 'json';
}

export interface ReportSection {
  title: string;
  content: string;
  charts?: ChartData[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  accent: string;
}

export interface ThemeFonts {
  primary: string;
  secondary: string;
  mono: string;
  sizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: string[];
  action: string;
  description: string;
  category: string;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  permissions: string[];
  hooks: PluginHooks;
}

export interface PluginHooks {
  onEncrypt?: (data: string) => string;
  onDecrypt?: (data: string) => string;
  onAnalyze?: (data: string) => AnalysisResult;
  onExport?: (data: string, format: string) => string;
}

export interface Settings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  accessibility: AccessibilitySettings;
  privacy: PrivacySettings;
  security: SecuritySettings;
  performance: PerformanceSettings;
  workspace: WorkspaceSettings;
  plugins: PluginSettings;
  notifications: NotificationSettings;
  shortcuts: KeyboardShortcut[];
  language: string;
  updates: UpdateSettings;
}

export interface GeneralSettings {
  autoSave: boolean;
  autoSaveInterval: number;
  confirmOnExit: boolean;
  defaultView: 'dashboard' | 'workspace' | 'analysis';
  startupBehavior: 'welcome' | 'last-session' | 'new-project';
}

export interface AppearanceSettings {
  theme: string;
  accentColor: string;
  font_size: string;
  font_family: string;
  border_radius: string;
  animations: boolean;
  transparency: boolean;
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  audioFeedback: boolean;
  largeText: boolean;
  zoom: number;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

export interface PrivacySettings {
  analytics: boolean;
  crashReporting: boolean;
  saveHistory: boolean;
  historyRetentionDays: number;
  clearOnExit: boolean;
}

export interface SecuritySettings {
  encryptLocalStorage: boolean;
  sessionTimeout: number;
  requireAuthentication: boolean;
  auditLog: boolean;
}

export interface PerformanceSettings {
  hardwareAcceleration: boolean;
  maxHistorySize: number;
  cacheSize: number;
  lazyLoading: boolean;
}

export interface WorkspaceSettings {
  defaultLocation: string;
  autoBackup: boolean;
  backupInterval: number;
  maxProjects: number;
}

export interface PluginSettings {
  enabled: string[];
  disabled: string[];
  autoUpdate: boolean;
  allowRemotePlugins: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  types: string[];
}

export interface UpdateSettings {
  autoCheck: boolean;
  channel: 'stable' | 'beta' | 'nightly';
  lastChecked: Date | null;
}
