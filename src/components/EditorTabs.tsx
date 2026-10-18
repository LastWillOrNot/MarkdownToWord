import React from 'react';
import {
  FileText,
  X,
  FolderTree,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { ProjectItem } from '../types';

interface EditorTabsProps {
  openTabs: string[];
  activeFileId: string;
  allItems: ProjectItem[];
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string, e: React.MouseEvent) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  openTabs,
  activeFileId,
  allItems,
  onSelectTab,
  onCloseTab,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  // Trouver le fichier actif pour construire le fil d'Ariane (breadcrumbs)
  const activeFile = allItems.find((f) => f.id === activeFileId);
  const pathParts = activeFile ? activeFile.path.split('/') : [];

  return (
    <div className="bg-slate-50 border-b border-slate-200 flex flex-col shrink-0 select-none">
      {/* Barre d'onglets horizontaux */}
      <div className="flex items-center overflow-x-auto scrollbar-none px-2 pt-1.5 gap-1">
        {/* Bouton pour afficher/masquer le panneau des répertoires */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition shrink-0 shadow-2xs mr-1 ${
            isSidebarOpen
              ? 'bg-blue-600 text-white border-blue-700'
              : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
          }`}
          title={isSidebarOpen ? "Masquer l'arborescence des répertoires" : "Ouvrir l'arborescence des répertoires"}
          aria-pressed={isSidebarOpen}
        >
          <FolderTree className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Répertoire</span>
        </button>

        {/* Liste des onglets ouverts */}
        {openTabs.map((tabId) => {
          const file = allItems.find((item) => item.id === tabId);
          if (!file) return null;
          const isActive = file.id === activeFileId;

          return (
            <div
              key={file.id}
              onClick={() => onSelectTab(file.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-t-lg border-t border-x cursor-pointer transition max-w-[220px] shrink-0 ${
                isActive
                  ? 'bg-white text-blue-700 font-semibold border-slate-200 border-b-white -mb-px shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border-transparent hover:text-slate-900'
              }`}
            >
              <FileText
                className={`h-3.5 w-3.5 shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{file.name}</span>

              {/* Indicateur de modification non enregistrée */}
              {file.isModified && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Fichier modifié" />
              )}

              {/* Bouton de fermeture de l'onglet */}
              {openTabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => onCloseTab(file.id, e)}
                  className="p-0.5 rounded-sm hover:bg-slate-300/60 text-slate-400 hover:text-slate-700 transition"
                  title="Fermer l'onglet"
                  aria-label={`Fermer l'onglet ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Fil d'Ariane (Breadcrumb) du document actif */}
      {activeFile && (
        <div className="px-3 py-1 bg-white/70 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1 text-slate-400">
            <Folder className="h-3 w-3 text-amber-500" />
            <span>Racine</span>
          </span>

          {pathParts.map((part, index) => {
            const isLast = index === pathParts.length - 1;
            return (
              <React.Fragment key={`breadcrumb-${index}`}>
                <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                <span
                  className={`truncate ${
                    isLast ? 'text-blue-700 font-semibold' : 'text-slate-600'
                  }`}
                >
                  {part}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
