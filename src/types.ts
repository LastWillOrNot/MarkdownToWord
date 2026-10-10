export type DocumentTheme = 'modern' | 'academic' | 'technical' | 'minimal';

export interface DocumentOptions {
  title: string;
  author: string;
  includePageNumbers: boolean;
  theme: DocumentTheme;
  fontSize: number; // in pt (10, 11, 12)
  lineSpacing: number; // 1.15, 1.5, 2.0
}

export interface DocumentStats {
  words: number;
  characters: number;
  readingTimeMinutes: number;
  headingsCount: number;
  tablesCount: number;
}
