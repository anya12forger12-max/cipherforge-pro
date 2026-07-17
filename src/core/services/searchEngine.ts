import type { Workspace } from '../services/workspaceManager';
import type { HistoryEntry } from '../services/historyManager';
import type { Bookmark, Note } from '../services/workspaceManager';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  content: string;
  relevanceScore: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
  location?: string;
  metadata?: Record<string, unknown>;
}

export type SearchResultType = 
  | 'workspace' 
  | 'file' 
  | 'report' 
  | 'history' 
  | 'bookmark' 
  | 'note' 
  | 'setting' 
  | 'documentation';

export interface SearchFilter {
  types?: SearchResultType[];
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchOptions {
  caseSensitive: boolean;
  useRegex: boolean;
  useWildcards: boolean;
  wholeWordsOnly: boolean;
  searchInContent: boolean;
  searchInMetadata: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  options: SearchOptions;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
}

export class SearchEngine {
  private savedSearches: Map<string, SavedSearch> = new Map();
  private searchHistory: string[] = [];
  private maxHistorySize: number = 50;

  search(
    query: string,
    sources: {
      workspaces?: Workspace[];
      history?: HistoryEntry[];
      bookmarks?: Bookmark[];
      notes?: Note[];
    },
    filters?: SearchFilter,
    options?: Partial<SearchOptions>
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const opts: SearchOptions = {
      caseSensitive: false,
      useRegex: false,
      useWildcards: false,
      wholeWordsOnly: false,
      searchInContent: true,
      searchInMetadata: true,
      ...options
    };

    const pattern = this.createSearchPattern(query, opts);

    // Search workspaces
    if (sources.workspaces) {
      for (const workspace of sources.workspaces) {
        if (filters?.types && !filters.types.includes('workspace')) continue;
        
        const matches = this.searchWorkspace(workspace, pattern, opts);
        results.push(...matches);
      }
    }

    // Search history
    if (sources.history) {
      for (const entry of sources.history) {
        if (filters?.types && !filters.types.includes('history')) continue;
        
        const matches = this.searchHistoryEntry(entry, pattern, opts);
        results.push(...matches);
      }
    }

    // Search bookmarks
    if (sources.bookmarks) {
      for (const bookmark of sources.bookmarks) {
        if (filters?.types && !filters.types.includes('bookmark')) continue;
        
        const matches = this.searchBookmark(bookmark, pattern, opts);
        results.push(...matches);
      }
    }

    // Search notes
    if (sources.notes) {
      for (const note of sources.notes) {
        if (filters?.types && !filters.types.includes('note')) continue;
        
        const matches = this.searchNote(note, pattern, opts);
        results.push(...matches);
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply limit and offset
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    
    // Add to search history
    this.addToSearchHistory(query);

    return results.slice(offset, offset + limit);
  }

  instantSearch(query: string, items: { id: string; title: string; content: string }[]): SearchResult[] {
    if (!query) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const item of items) {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const contentMatch = item.content.toLowerCase().includes(lowerQuery);

      if (titleMatch || contentMatch) {
        results.push({
          id: item.id,
          type: 'file',
          title: item.title,
          description: item.content.substring(0, 100),
          content: item.content,
          relevanceScore: titleMatch ? 100 : 50,
          matchType: 'partial'
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10);
  }

  fuzzySearch(query: string, items: { id: string; title: string }[]): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const item of items) {
      const score = this.calculateFuzzyScore(lowerQuery, item.title.toLowerCase());
      if (score > 0.3) {
        results.push({
          id: item.id,
          type: 'file',
          title: item.title,
          description: '',
          content: '',
          relevanceScore: score * 100,
          matchType: 'fuzzy'
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  saveSearch(name: string, query: string, filters: SearchFilter, options: SearchOptions): SavedSearch {
    const saved: SavedSearch = {
      id: crypto.randomUUID(),
      name,
      query,
      filters,
      options,
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 1
    };

    this.savedSearches.set(saved.id, saved);
    this.saveToStorage();
    return saved;
  }

  getSavedSearches(): SavedSearch[] {
    return Array.from(this.savedSearches.values())
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  }

  deleteSavedSearch(id: string): boolean {
    return this.savedSearches.delete(id);
  }

  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  clearSearchHistory(): void {
    this.searchHistory = [];
    localStorage.removeItem('cipherforge-search-history');
  }

  private searchWorkspace(workspace: Workspace, pattern: RegExp, options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];

    // Search workspace name
    if (this.matchesPattern(workspace.name, pattern)) {
      results.push({
        id: workspace.id,
        type: 'workspace',
        title: workspace.name,
        description: workspace.description,
        content: workspace.description,
        relevanceScore: 100,
        matchType: 'exact'
      });
    }

    // Search workspace files
    for (const file of workspace.files) {
      if (this.matchesPattern(file.metadata.name, pattern)) {
        results.push({
          id: file.metadata.id,
          type: 'file',
          title: file.metadata.name,
          description: `Size: ${file.metadata.size} bytes`,
          content: options.searchInContent ? file.content.substring(0, 500) : '',
          relevanceScore: 80,
          matchType: 'exact',
          location: workspace.name
        });
      }
    }

    return results;
  }

  private searchHistoryEntry(entry: HistoryEntry, pattern: RegExp, _options?: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];

    if (this.matchesPattern(entry.operation, pattern) ||
        (entry.fileName && this.matchesPattern(entry.fileName, pattern))) {
      results.push({
        id: entry.id,
        type: 'history',
        title: `${entry.operation} - ${entry.fileName || 'Unknown'}`,
        description: `Shift: ${entry.shift || 'N/A'}, Time: ${entry.processingTime.toFixed(2)}ms`,
        content: JSON.stringify(entry.metadata),
        relevanceScore: 70,
        matchType: 'partial'
      });
    }

    return results;
  }

  private searchBookmark(bookmark: Bookmark, pattern: RegExp, _options?: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];

    if (this.matchesPattern(bookmark.title, pattern) ||
        this.matchesPattern(bookmark.description, pattern) ||
        this.matchesPattern(bookmark.content, pattern)) {
      results.push({
        id: bookmark.id,
        type: 'bookmark',
        title: bookmark.title,
        description: bookmark.description,
        content: bookmark.content,
        relevanceScore: 75,
        matchType: 'partial',
        metadata: { tags: bookmark.tags }
      });
    }

    return results;
  }

  private searchNote(note: Note, pattern: RegExp, _options?: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];

    if (this.matchesPattern(note.title, pattern) ||
        this.matchesPattern(note.content, pattern)) {
      results.push({
        id: note.id,
        type: 'note',
        title: note.title,
        description: note.content.substring(0, 100),
        content: note.content,
        relevanceScore: 65,
        matchType: 'partial',
        metadata: { tags: note.tags }
      });
    }

    return results;
  }

  private createSearchPattern(query: string, options: SearchOptions): RegExp {
    let pattern = query;

    if (!options.caseSensitive) {
      pattern = pattern.toLowerCase();
    }

    if (options.useRegex) {
      return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
    }

    if (options.useWildcards) {
      pattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    } else {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    if (options.wholeWordsOnly) {
      pattern = `\\b${pattern}\\b`;
    }

    return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
  }

  private matchesPattern(text: string, pattern: RegExp): boolean {
    const searchText = pattern.flags.includes('i') ? text.toLowerCase() : text;
    const searchPattern = new RegExp(pattern.source, pattern.flags.replace('g', ''));
    return searchPattern.test(searchText);
  }

  private calculateFuzzyScore(query: string, target: string): number {
    const queryLength = query.length;
    const targetLength = target.length;

    if (queryLength === 0) return 1;
    if (targetLength === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= queryLength; i++) {
      matrix[i] = [];
      for (let j = 0; j <= targetLength; j++) {
        if (i === 0) {
          matrix[i][j] = j;
        } else if (j === 0) {
          matrix[i][j] = i;
        } else {
          const cost = query[i - 1] === target[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
    }

    const maxLen = Math.max(queryLength, targetLength);
    return 1 - matrix[queryLength][targetLength] / maxLen;
  }

  private addToSearchHistory(query: string): void {
    this.searchHistory = [query, ...this.searchHistory.filter(q => q !== query)].slice(0, this.maxHistorySize);
    localStorage.setItem('cipherforge-search-history', JSON.stringify(this.searchHistory));
  }

  private saveToStorage(): void {
    const saved = Array.from(this.savedSearches.values());
    localStorage.setItem('cipherforge-saved-searches', JSON.stringify(saved));
  }

  loadFromStorage(): void {
    const searchesData = localStorage.getItem('cipherforge-saved-searches');
    if (searchesData) {
      const searches = JSON.parse(searchesData) as SavedSearch[];
      for (const search of searches) {
        this.savedSearches.set(search.id, search);
      }
    }

    const historyData = localStorage.getItem('cipherforge-search-history');
    if (historyData) {
      this.searchHistory = JSON.parse(historyData);
    }
  }
}

export const searchEngine = new SearchEngine();
