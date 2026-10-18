import React, { useState, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Archive,
  Search,
  RotateCcw,
  X,
  Check,
  FileCode,
} from 'lucide-react';
import { ProjectItem } from '../types';

interface DirectorySidebarProps {
  rootName: string;
  items: ProjectItem[];
  activeFileId: string;
  onSelectFile: (file: ProjectItem) => void;
  onToggleFolder: (folderId: string) => void;
  onCreateFile: (parentFolderId: string | null, fileName: string) => void;
  onCreateFolder: (parentFolderId: string | null, folderName: string) => void;
  onDeleteItem: (itemId: string) => void;
  onRenameItem: (itemId: string, newName: string) => void;
  onImportDirectory: (files: FileList) => void;
  onExportZip: (type: 'docx' | 'markdown' | 'both') => void;
  onResetDefaultProject: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const DirectorySidebar: React.FC<DirectorySidebarProps> = ({
  rootName,
  items,
  activeFileId,
  onSelectFile,
  onToggleFolder,
  onCreateFile,
  onCreateFolder,
  onDeleteItem,
  onRenameItem,
  onImportDirectory,
  onExportZip,
  onResetDefaultProject,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [targetParentFolderId, setTargetParentFolderId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const dirInputRef = useRef<HTMLInputElement>(null);

  // Détection du support de l'API moderne File System Access
  const handleOpenFolderClick = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle) {
          // Parcourir récursivement les fichiers via l'API native
          const files: File[] = [];
          async function scanDir(handle: any, currentPath: string) {
            for await (const entry of handle.values()) {
              if (entry.kind === 'file') {
                const file = await entry.getFile();
                // Définir webkitRelativePath synthétique
                Object.defineProperty(file, 'webkitRelativePath', {
                  value: `${currentPath}/${file.name}`,
                });
                files.push(file);
              } else if (entry.kind === 'directory') {
                await scanDir(entry, `${currentPath}/${entry.name}`);
              }
            }
          }
          await scanDir(dirHandle, dirHandle.name);
          if (files.length > 0) {
            // Créer une liste synthétique
            const dt = new DataTransfer();
            files.forEach((f) => dt.items.add(f));
            onImportDirectory(dt.files);
            return;
          }
        }
      } catch (err: any) {
        // Si l'utilisateur annule, ne rien faire ; sinon fallback sur l'input
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback standard
    dirInputRef.current?.click();
  };

  const handleDirectoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportDirectory(e.target.files);
      e.target.value = '';
    }
  };

  const handleStartRename = (item: ProjectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItemId(item.id);
    setEditName(item.name);
  };

  const handleSaveRename = (itemId: string) => {
    if (editName.trim()) {
      onRenameItem(itemId, editName.trim());
    }
    setEditingItemId(null);
  };

  const handleConfirmCreate = () => {
    if (!newItemName.trim()) return;
    if (isNewFileModalOpen) {
      onCreateFile(targetParentFolderId, newItemName.trim());
    } else if (isNewFolderModalOpen) {
      onCreateFolder(targetParentFolderId, newItemName.trim());
    }
    setNewItemName('');
    setIsNewFileModalOpen(false);
    setIsNewFolderModalOpen(false);
    setTargetParentFolderId(null);
  };

  // Filtrage par recherche
  const filterNodes = (nodes: ProjectItem[], query: string): ProjectItem[] => {
    if (!query) return nodes;
    const lower = query.toLowerCase();

    return nodes.reduce<ProjectItem[]>((acc, node) => {
      if (node.type === 'file') {
        if (node.name.toLowerCase().includes(lower)) {
          acc.push(node);
        }
      } else if (node.type === 'folder' && node.children) {
        const filteredChildren = filterNodes(node.children, query);
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lower)) {
          acc.push({
            ...node,
            isOpen: true,
            children: filteredChildren,
          });
        }
      }
      return acc;
    }, []);
  };

  const displayedItems = filterNodes(items, searchQuery);

  // Rendu récursif des nœuds de l'arbre
  const renderTree = (nodes: ProjectItem[], depth = 0) => {
    return (
      <ul className="space-y-0.5" role="tree">
        {nodes.map((node) => {
          const isFile = node.type === 'file';
          const isActive = isFile && node.id === activeFileId;
          const isEditing = editingItemId === node.id;

          if (isFile) {
            return (
              <li key={node.id} role="treeitem" aria-selected={isActive}>
                <div
                  onClick={() => onSelectFile(node)}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  style={{ paddingLeft: `${Math.max(8, depth * 16 + 8)}px` }}
                >
                  <div className="flex items-center gap-1.5 truncate flex-1 mr-1">
                    <FileText
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isActive ? 'text-white' : 'text-blue-600'
                      }`}
                    />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleSaveRename(node.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(node.id);
                          if (e.key === 'Escape') setEditingItemId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white text-slate-900 px-1 py-0.5 rounded text-xs border border-blue-400 focus:outline-none w-full"
                      />
                    ) : (
                      <span className="truncate">{node.name}</span>
                    )}
                    {node.isModified && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isActive ? 'bg-amber-300' : 'bg-amber-500'
                        }`}
                        title="Modifié"
                      />
                    )}
                  </div>

                  {/* Actions survolées */}
                  {!isEditing && (
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(node, e)}
                        className={`p-1 rounded hover:bg-black/10 transition ${
                          isActive ? 'text-white' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title="Renommer le fichier"
                        aria-label="Renommer"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Supprimer le fichier « ${node.name} » ?`)) {
                            onDeleteItem(node.id);
                          }
                        }}
                        className={`p-1 rounded hover:bg-red-500 hover:text-white transition ${
                          isActive ? 'text-white' : 'text-slate-400 hover:text-red-600'
                        }`}
                        title="Supprimer le fichier"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          }

          // Dossier
          const isFolderOpen = node.isOpen !== false;
          return (
            <li key={node.id} role="treeitem" aria-expanded={isFolderOpen}>
              <div
                onClick={() => onToggleFolder(node.id)}
                className="group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition select-none"
                style={{ paddingLeft: `${Math.max(8, depth * 16 + 8)}px` }}
              >
                <div className="flex items-center gap-1.5 truncate flex-1 mr-1">
                  <span className="text-slate-400 shrink-0">
                    {isFolderOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </span>
                  {isFolderOpen ? (
                    <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}

                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleSaveRename(node.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(node.id);
                        if (e.key === 'Escape') setEditingItemId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white text-slate-900 px-1 py-0.5 rounded text-xs border border-blue-400 focus:outline-none w-full"
                    />
                  ) : (
                    <span className="truncate">{node.name}</span>
                  )}
                </div>

                {/* Actions dossier */}
                {!isEditing && (
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetParentFolderId(node.id);
                        setIsNewFileModalOpen(true);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
                      title="Nouveau fichier dans ce dossier"
                      aria-label="Ajouter un fichier"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(node, e)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                      title="Renommer le dossier"
                      aria-label="Renommer"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Supprimer le dossier « ${node.name} » et son contenu ?`)) {
                          onDeleteItem(node.id);
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Supprimer le dossier"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Enfants si déplié */}
              {isFolderOpen && node.children && node.children.length > 0 && (
                <div>{renderTree(node.children, depth + 1)}</div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      {/* Panneau latéral fixe ou escamotable */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 shadow-xl lg:shadow-none lg:static lg:w-72 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Explorateur de répertoires"
      >
        {/* En-tête du panneau Répertoire */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <FolderOpen className="h-4 w-4 text-blue-700 shrink-0" />
            <div className="truncate">
              <h2 className="text-xs font-bold text-slate-900 truncate uppercase tracking-wider">
                {rootName}
              </h2>
              <span className="text-[10px] text-slate-500">Espace de travail</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onResetDefaultProject}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition"
              title="Réinitialiser l'espace de démonstration"
              aria-label="Réinitialiser"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition"
              aria-label="Fermer l'explorateur"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Barre d'actions rapides sur le répertoire */}
        <div className="p-2 border-b border-slate-100 bg-white flex items-center gap-1">
          {/* Input masqué pour import répertoire webkitdirectory */}
          <input
            ref={dirInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory="true"
            // @ts-ignore
            directory="true"
            multiple
            onChange={handleDirectoryInputChange}
            className="hidden"
            id="directory-upload-input"
            aria-label="Charger un répertoire complet"
          />

          <button
            type="button"
            onClick={handleOpenFolderClick}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/80 transition shadow-2xs"
            title="Ouvrir un dossier de votre ordinateur contenant des fichiers .md ou .docx"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Ouvrir un dossier</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetParentFolderId(null);
              setIsNewFileModalOpen(true);
            }}
            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg transition"
            title="Nouveau fichier à la racine"
            aria-label="Créer un fichier"
          >
            <FileCode className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetParentFolderId(null);
              setIsNewFolderModalOpen(true);
            }}
            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg transition"
            title="Nouveau sous-dossier"
            aria-label="Créer un sous-dossier"
          >
            <Folder className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Barre de recherche dans le projet */}
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un document..."
              className="w-full pl-8 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Arborescence des fichiers et dossiers */}
        <div className="flex-1 overflow-y-auto p-2">
          {displayedItems.length > 0 ? (
            renderTree(displayedItems)
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              Aucun fichier ne correspond à votre recherche.
            </div>
          )}
        </div>

        {/* Pied de l'explorateur : Export groupé ZIP */}
        <div className="p-2.5 border-t border-slate-200 bg-slate-50/70 relative">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <span className="flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5 text-emerald-600" />
              <span>Exporter tout le répertoire</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Menu déroulant de choix d'export ZIP */}
          {isExportMenuOpen && (
            <div className="absolute bottom-12 left-2 right-2 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 text-xs animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => {
                  onExportZip('docx');
                  setIsExportMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-md flex items-center justify-between"
              >
                <span>Tous les documents en Word (.docx)</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">
                  ZIP
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportZip('markdown');
                  setIsExportMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded-md flex items-center justify-between"
              >
                <span>Tous les fichiers Markdown (.md)</span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                  ZIP
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportZip('both');
                  setIsExportMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded-md flex items-center justify-between font-medium"
              >
                <span>Projet complet (Markdown + Word)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                  ZIP
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Fond semi-transparent pour mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Modal de création Nouveau fichier / Nouveau dossier */}
      {(isNewFileModalOpen || isNewFolderModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {isNewFileModalOpen ? 'Nouveau fichier Markdown' : 'Nouveau sous-dossier'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isNewFileModalOpen
                ? 'Indiquez le nom du document (ex: 02_Architecture.md)'
                : 'Indiquez le nom du répertoire (ex: 04_Annexes)'}
            </p>

            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={isNewFileModalOpen ? 'nouveau-document.md' : 'Nom_du_dossier'}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate();
                if (e.key === 'Escape') {
                  setIsNewFileModalOpen(false);
                  setIsNewFolderModalOpen(false);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsNewFileModalOpen(false);
                  setIsNewFolderModalOpen(false);
                  setNewItemName('');
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={!newItemName.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition shadow-2xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Créer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
