export interface HistoryEntry {
  id: string;
  timestamp: Date;
  operation: HistoryOperation;
  shift?: number;
  processingTime: number;
  fileName?: string;
  fileSize?: number;
  analysisType?: string;
  exportType?: string;
  workspaceId?: string;
  isBookmarked: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
}

export type HistoryOperation = 
  | 'encrypt' 
  | 'decrypt' 
  | 'brute-force' 
  | 'frequency-analysis' 
  | 'import' 
  | 'export' 
  | 'analyze';

export interface HistoryFilter {
  operation?: HistoryOperation;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  tags?: string[];
  isBookmarked?: boolean;
}

export interface HistoryStats {
  totalOperations: number;
  operationsByType: Record<HistoryOperation, number>;
  averageProcessingTime: number;
  mostUsedShift: number;
  totalFilesProcessed: number;
  lastActivity: Date | null;
}

export class HistoryManager {
  private entries: Map<string, HistoryEntry> = new Map();
  private maxEntries: number = 1000;

  addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'isBookmarked' | 'tags'>): HistoryEntry {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      isBookmarked: false,
      tags: []
    };

    this.entries.set(newEntry.id, newEntry);

    // Trim old entries if we exceed max
    if (this.entries.size > this.maxEntries) {
      const sorted = this.getSortedEntries();
      const toRemove = sorted.slice(this.maxEntries);
      toRemove.forEach(e => this.entries.delete(e.id));
    }

    this.saveToStorage();
    return newEntry;
  }

  getEntry(id: string): HistoryEntry | undefined {
    return this.entries.get(id);
  }

  getAllEntries(): HistoryEntry[] {
    return this.getSortedEntries();
  }

  getFilteredEntries(filter: HistoryFilter): HistoryEntry[] {
    let entries = this.getSortedEntries();

    if (filter.operation) {
      entries = entries.filter(e => e.operation === filter.operation);
    }

    if (filter.startDate) {
      entries = entries.filter(e => e.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      entries = entries.filter(e => e.timestamp <= filter.endDate!);
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      entries = entries.filter(e => 
        e.operation.toLowerCase().includes(term) ||
        (e.fileName?.toLowerCase().includes(term)) ||
        JSON.stringify(e.metadata).toLowerCase().includes(term)
      );
    }

    if (filter.tags?.length) {
      entries = entries.filter(e => 
        filter.tags!.some(tag => e.tags.includes(tag))
      );
    }

    if (filter.isBookmarked !== undefined) {
      entries = entries.filter(e => e.isBookmarked === filter.isBookmarked);
    }

    return entries;
  }

  searchEntries(query: string): HistoryEntry[] {
    const term = query.toLowerCase();
    return this.getSortedEntries().filter(e =>
      e.operation.toLowerCase().includes(term) ||
      (e.fileName?.toLowerCase().includes(term)) ||
      (e.analysisType?.toLowerCase().includes(term)) ||
      (e.exportType?.toLowerCase().includes(term)) ||
      e.tags.some(t => t.toLowerCase().includes(term))
    );
  }

  bookmarkEntry(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.isBookmarked = true;
    this.saveToStorage();
    return true;
  }

  unbookmarkEntry(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.isBookmarked = false;
    this.saveToStorage();
    return true;
  }

  toggleBookmark(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.isBookmarked = !entry.isBookmarked;
    this.saveToStorage();
    return entry.isBookmarked;
  }

  addTag(id: string, tag: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    if (!entry.tags.includes(tag)) {
      entry.tags.push(tag);
      this.saveToStorage();
    }
    return true;
  }

  removeTag(id: string, tag: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    const index = entry.tags.indexOf(tag);
    if (index !== -1) {
      entry.tags.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteEntry(id: string): boolean {
    const result = this.entries.delete(id);
    if (result) this.saveToStorage();
    return result;
  }

  clearHistory(): void {
    this.entries.clear();
    this.saveToStorage();
  }

  exportHistory(): string {
    const entries = this.getSortedEntries();
    return JSON.stringify(entries, null, 2);
  }

  importHistory(data: string): number {
    const entries = JSON.parse(data) as HistoryEntry[];
    let imported = 0;
    
    for (const entry of entries) {
      if (!this.entries.has(entry.id)) {
        this.entries.set(entry.id, entry);
        imported++;
      }
    }
    
    this.saveToStorage();
    return imported;
  }

  getStats(): HistoryStats {
    const entries = Array.from(this.entries.values());
    
    const operationsByType: Record<HistoryOperation, number> = {
      'encrypt': 0,
      'decrypt': 0,
      'brute-force': 0,
      'frequency-analysis': 0,
      'import': 0,
      'export': 0,
      'analyze': 0
    };

    let totalTime = 0;
    const shiftCounts = new Map<number, number>();
    let filesProcessed = 0;

    for (const entry of entries) {
      operationsByType[entry.operation]++;
      totalTime += entry.processingTime;
      
      if (entry.shift !== undefined) {
        shiftCounts.set(entry.shift, (shiftCounts.get(entry.shift) || 0) + 1);
      }
      
      if (entry.fileName) filesProcessed++;
    }

    let mostUsedShift = 0;
    let maxCount = 0;
    for (const [shift, count] of shiftCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostUsedShift = shift;
      }
    }

    const sortedEntries = this.getSortedEntries();
    const lastActivity = sortedEntries.length > 0 ? sortedEntries[0].timestamp : null;

    return {
      totalOperations: entries.length,
      operationsByType,
      averageProcessingTime: entries.length > 0 ? totalTime / entries.length : 0,
      mostUsedShift,
      totalFilesProcessed: filesProcessed,
      lastActivity
    };
  }

  getBookmarkedEntries(): HistoryEntry[] {
    return this.getSortedEntries().filter(e => e.isBookmarked);
  }

  getRecentEntries(count: number = 10): HistoryEntry[] {
    return this.getSortedEntries().slice(0, count);
  }

  getEntriesByOperation(operation: HistoryOperation): HistoryEntry[] {
    return this.getSortedEntries().filter(e => e.operation === operation);
  }

  private getSortedEntries(): HistoryEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private saveToStorage(): void {
    const entries = this.getSortedEntries();
    localStorage.setItem('cipherforge-history', JSON.stringify(entries));
  }

  loadFromStorage(): void {
    const data = localStorage.getItem('cipherforge-history');
    if (data) {
      const entries = JSON.parse(data) as HistoryEntry[];
      for (const entry of entries) {
        this.entries.set(entry.id, entry);
      }
    }
  }
}

export const historyManager = new HistoryManager();
