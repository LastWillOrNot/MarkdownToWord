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

/**
 * Types pour la gestion des répertoires et espaces de travail multi-fichiers
 */
export type ItemType = 'file' | 'folder';

export interface ProjectItem {
  id: string;
  name: string;
  path: string; // ex: "01_Specifications/Cycle_Vie.md"
  type: ItemType;
  content?: string; // Contenu Markdown pour les fichiers
  children?: ProjectItem[]; // Sous-dossiers et fichiers pour un dossier
  isOpen?: boolean; // Dossier déplié/replié
  isModified?: boolean; // Modifications non exportées
}

export interface WorkspaceProject {
  rootName: string;
  items: ProjectItem[];
}
