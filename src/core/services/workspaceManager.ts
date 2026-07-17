import type { ProcessedFile } from '../types/files';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  files: ProcessedFile[];
  settings: WorkspaceSettings;
  tabs: WorkspaceTab[];
  history: WorkspaceVersion[];
  bookmarks: Bookmark[];
  notes: Note[];
  layout: LayoutConfig;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface WorkspaceSettings {
  theme: string;
  language: string;
  accessibility: Record<string, boolean>;
  shortcuts: Record<string, string>;
  autoSave: boolean;
  autoSaveInterval: number;
}

export interface WorkspaceTab {
  id: string;
  title: string;
  type: 'file' | 'analysis' | 'report' | 'visualization';
  content: string;
  isPinned: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceVersion {
  id: string;
  timestamp: Date;
  label: string;
  snapshot: Partial<Workspace>;
  changes: string[];
}

export interface Bookmark {
  id: string;
  title: string;
  description: string;
  type: 'analysis' | 'report' | 'ciphertext' | 'result';
  content: string;
  tags: string[];
  color: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LayoutConfig {
  sidebarOpen: boolean;
  sidebarWidth: number;
  panels: PanelConfig[];
  splitDirection: 'horizontal' | 'vertical';
}

export interface PanelConfig {
  id: string;
  type: string;
  width: number;
  height: number;
  position: { x: number; y: number };
  isVisible: boolean;
}

export class WorkspaceManager {
  private workspaces: Map<string, Workspace> = new Map();
  private activeWorkspaceId: string | null = null;

  createWorkspace(name: string, description: string = ''): Workspace {
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      name,
      description,
      files: [],
      settings: this.getDefaultSettings(),
      tabs: [],
      history: [],
      bookmarks: [],
      notes: [],
      layout: this.getDefaultLayout(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.get(id);
  }

  getAllWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  updateWorkspace(id: string, updates: Partial<Workspace>): Workspace | undefined {
    const workspace = this.workspaces.get(id);
    if (!workspace) return undefined;

    const updated = {
      ...workspace,
      ...updates,
      updatedAt: new Date(),
      version: workspace.version + 1
    };

    this.workspaces.set(id, updated);
    return updated;
  }

  deleteWorkspace(id: string): boolean {
    if (this.activeWorkspaceId === id) {
      this.activeWorkspaceId = null;
    }
    return this.workspaces.delete(id);
  }

  duplicateWorkspace(id: string, newName?: string): Workspace | undefined {
    const original = this.workspaces.get(id);
    if (!original) return undefined;

    const duplicate: Workspace = {
      ...JSON.parse(JSON.stringify(original)),
      id: crypto.randomUUID(),
      name: newName || `${original.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    this.workspaces.set(duplicate.id, duplicate);
    return duplicate;
  }

  setActiveWorkspace(id: string): void {
    if (this.workspaces.has(id)) {
      this.activeWorkspaceId = id;
    }
  }

  getActiveWorkspace(): Workspace | undefined {
    return this.activeWorkspaceId ? this.workspaces.get(this.activeWorkspaceId) : undefined;
  }

  saveWorkspace(id: string): void {
    const workspace = this.workspaces.get(id);
    if (workspace) {
      localStorage.setItem(`cipherforge-workspace-${id}`, JSON.stringify(workspace));
    }
  }

  loadWorkspace(id: string): Workspace | undefined {
    const saved = localStorage.getItem(`cipherforge-workspace-${id}`);
    if (saved) {
      const workspace = JSON.parse(saved) as Workspace;
      this.workspaces.set(id, workspace);
      return workspace;
    }
    return undefined;
  }

  exportWorkspace(id: string): string {
    const workspace = this.workspaces.get(id);
    if (!workspace) throw new Error('Workspace not found');
    return JSON.stringify(workspace, null, 2);
  }

  importWorkspace(data: string): Workspace {
    const workspace = JSON.parse(data) as Workspace;
    workspace.id = crypto.randomUUID();
    workspace.createdAt = new Date();
    workspace.updatedAt = new Date();
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  // Tab management
  addTab(workspaceId: string, tab: Omit<WorkspaceTab, 'id'>): WorkspaceTab | undefined {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return undefined;

    const newTab: WorkspaceTab = {
      ...tab,
      id: crypto.randomUUID()
    };

    workspace.tabs.push(newTab);
    workspace.updatedAt = new Date();
    return newTab;
  }

  closeTab(workspaceId: string, tabId: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    const index = workspace.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return false;

    workspace.tabs.splice(index, 1);
    workspace.updatedAt = new Date();
    return true;
  }

  reorderTabs(workspaceId: string, fromIndex: number, toIndex: number): void {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return;

    const [tab] = workspace.tabs.splice(fromIndex, 1);
    workspace.tabs.splice(toIndex, 0, tab);
    workspace.updatedAt = new Date();
  }

  // Bookmark management
  addBookmark(workspaceId: string, bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark | undefined {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return undefined;

    const newBookmark: Bookmark = {
      ...bookmark,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };

    workspace.bookmarks.push(newBookmark);
    workspace.updatedAt = new Date();
    return newBookmark;
  }

  removeBookmark(workspaceId: string, bookmarkId: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    const index = workspace.bookmarks.findIndex(b => b.id === bookmarkId);
    if (index === -1) return false;

    workspace.bookmarks.splice(index, 1);
    workspace.updatedAt = new Date();
    return true;
  }

  getBookmarks(workspaceId: string, filter?: { type?: string; tags?: string[] }): Bookmark[] {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return [];

    let bookmarks = workspace.bookmarks;

    if (filter?.type) {
      bookmarks = bookmarks.filter(b => b.type === filter.type);
    }

    if (filter?.tags?.length) {
      bookmarks = bookmarks.filter(b => 
        filter.tags!.some(tag => b.tags.includes(tag))
      );
    }

    return bookmarks;
  }

  // Note management
  addNote(workspaceId: string, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note | undefined {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return undefined;

    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    workspace.notes.push(newNote);
    workspace.updatedAt = new Date();
    return newNote;
  }

  updateNote(workspaceId: string, noteId: string, updates: Partial<Note>): Note | undefined {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return undefined;

    const note = workspace.notes.find(n => n.id === noteId);
    if (!note) return undefined;

    Object.assign(note, updates, { updatedAt: new Date() });
    workspace.updatedAt = new Date();
    return note;
  }

  deleteNote(workspaceId: string, noteId: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    const index = workspace.notes.findIndex(n => n.id === noteId);
    if (index === -1) return false;

    workspace.notes.splice(index, 1);
    workspace.updatedAt = new Date();
    return true;
  }

  // Version management
  createSnapshot(workspaceId: string, label: string): WorkspaceVersion | undefined {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return undefined;

    const snapshot: WorkspaceVersion = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      label,
      snapshot: {
        files: workspace.files,
        tabs: workspace.tabs,
        bookmarks: workspace.bookmarks,
        notes: workspace.notes,
        layout: workspace.layout
      },
      changes: []
    };

    workspace.history.push(snapshot);
    workspace.updatedAt = new Date();
    return snapshot;
  }

  restoreSnapshot(workspaceId: string, versionId: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    const version = workspace.history.find(v => v.id === versionId);
    if (!version) return false;

    if (version.snapshot.files) workspace.files = version.snapshot.files;
    if (version.snapshot.tabs) workspace.tabs = version.snapshot.tabs;
    if (version.snapshot.bookmarks) workspace.bookmarks = version.snapshot.bookmarks;
    if (version.snapshot.notes) workspace.notes = version.snapshot.notes;
    if (version.snapshot.layout) workspace.layout = version.snapshot.layout;

    workspace.updatedAt = new Date();
    return true;
  }

  getVersionHistory(workspaceId: string): WorkspaceVersion[] {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return [];
    return workspace.history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private getDefaultSettings(): WorkspaceSettings {
    return {
      theme: 'dark',
      language: 'en',
      accessibility: {
        reducedMotion: false,
        highContrast: false,
        screenReader: false
      },
      shortcuts: {},
      autoSave: true,
      autoSaveInterval: 300000 // 5 minutes
    };
  }

  private getDefaultLayout(): LayoutConfig {
    return {
      sidebarOpen: true,
      sidebarWidth: 260,
      panels: [],
      splitDirection: 'horizontal'
    };
  }
}

export const workspaceManager = new WorkspaceManager();
