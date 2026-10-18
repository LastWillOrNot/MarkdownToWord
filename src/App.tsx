/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { MarkdownEditor } from './components/MarkdownEditor';
import { DocumentPreview } from './components/DocumentPreview';
import { ExportToolbar } from './components/ExportToolbar';
import { DirectorySidebar } from './components/DirectorySidebar';
import { EditorTabs } from './components/EditorTabs';
import { SAMPLES, MarkdownSample } from './utils/samples';
import { calculateDocumentStats, extractTitle } from './utils/markdownParser';
import { generateWordDocument, downloadBlob } from './utils/wordGenerator';
import { convertDocxToMarkdown, downloadMarkdownFile } from './utils/docxToMarkdown';
import {
  DEFAULT_PROJECT_TREE,
  getAllFiles,
  findItemById,
  updateFileContentInTree,
  createFileInTree,
  createFolderInTree,
  deleteItemFromTree,
  renameItemInTree,
  toggleFolderInTree,
  loadDirectoryFromFiles,
  exportProjectToZip,
} from './utils/workspaceManager';
import { DocumentOptions, ProjectItem } from './types';
import { Columns2, Edit3, Eye, ArrowLeftRight, FolderTree, Link2, Unlink2 } from 'lucide-react';

export default function App() {
  // Arborescence du répertoire de travail (Espace multi-fichiers)
  const [projectTree, setProjectTree] = useState<ProjectItem[]>(() => DEFAULT_PROJECT_TREE);
  const [rootName, setRootName] = useState<string>('Projet_Documentation_2026');
  const [activeFileId, setActiveFileId] = useState<string>('f-root-intro');
  const [openTabs, setOpenTabs] = useState<string[]>([
    'f-root-intro',
    'f-spec-mermaid',
    'f-code-services',
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // État du document actif en cours d'édition
  const initialFile = useMemo(() => {
    return findItemById(DEFAULT_PROJECT_TREE, 'f-root-intro');
  }, []);

  const [markdown, setMarkdown] = useState<string>(initialFile?.content || '');
  const [filename, setFilename] = useState<string>('00_Index_et_Introduction');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Options de document pour l'export Word
  const [options, setOptions] = useState<DocumentOptions>({
    title: "Projet de Référentiel Documentaire 2026",
    author: 'Direction des Systèmes d’Information',
    includePageNumbers: true,
    theme: 'modern',
    fontSize: 11,
    lineSpacing: 1.15,
  });

  // Calcul des statistiques du document actif
  const stats = useMemo(() => {
    return calculateDocumentStats(markdown);
  }, [markdown]);

  const showNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4500);
  };

  // Références et synchronisation du défilement dans la vue côte à côte
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [isScrollSynced, setIsScrollSynced] = useState<boolean>(true);
  const isSyncingScrollRef = useRef<'editor' | 'preview' | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronisation du défilement : Éditeur Markdown -> Aperçu Word
  const handleEditorScroll = useCallback(() => {
    if (!isScrollSynced || viewMode !== 'split') return;
    if (isSyncingScrollRef.current === 'preview') return;

    isSyncingScrollRef.current = 'editor';
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    const editorEl = editorTextareaRef.current;
    const previewEl = previewContainerRef.current;

    if (editorEl && previewEl) {
      const editorMax = editorEl.scrollHeight - editorEl.clientHeight;
      if (editorMax > 0) {
        const scrollRatio = editorEl.scrollTop / editorMax;
        const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
        previewEl.scrollTop = Math.round(scrollRatio * previewMax);
      }
    }

    syncTimeoutRef.current = setTimeout(() => {
      isSyncingScrollRef.current = null;
    }, 80);
  }, [isScrollSynced, viewMode]);

  // Synchronisation du défilement : Aperçu Word -> Éditeur Markdown
  const handlePreviewScroll = useCallback(() => {
    if (!isScrollSynced || viewMode !== 'split') return;
    if (isSyncingScrollRef.current === 'editor') return;

    isSyncingScrollRef.current = 'preview';
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    const editorEl = editorTextareaRef.current;
    const previewEl = previewContainerRef.current;

    if (editorEl && previewEl) {
      const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
      if (previewMax > 0) {
        const scrollRatio = previewEl.scrollTop / previewMax;
        const editorMax = editorEl.scrollHeight - editorEl.clientHeight;
        editorEl.scrollTop = Math.round(scrollRatio * editorMax);
      }
    }

    syncTimeoutRef.current = setTimeout(() => {
      isSyncingScrollRef.current = null;
    }, 80);
  }, [isScrollSynced, viewMode]);

  // Synchronisation du contenu Markdown modifié avec l'arborescence du projet
  const handleMarkdownChange = useCallback(
    (newContent: string) => {
      setMarkdown(newContent);
      setProjectTree((prevTree) =>
        updateFileContentInTree(prevTree, activeFileId, newContent)
      );
    },
    [activeFileId]
  );

  // Sélection d'un fichier dans le répertoire ou dans les onglets
  const handleSelectFile = useCallback(
    (file: ProjectItem) => {
      if (file.type !== 'file') return;

      // 1. Sauvegarder le fichier courant avant de basculer
      setProjectTree((prevTree) =>
        updateFileContentInTree(prevTree, activeFileId, markdown)
      );

      // 2. Activer le nouveau fichier
      setActiveFileId(file.id);
      const targetContent = file.content || '';
      setMarkdown(targetContent);

      const cleanName = file.name.replace(/\.(md|markdown|txt|docx)$/i, '');
      setFilename(cleanName);

      setOptions((prev) => ({
        ...prev,
        title: extractTitle(targetContent) || cleanName,
      }));

      // 3. Remettre le défilement au sommet du document
      if (editorTextareaRef.current) editorTextareaRef.current.scrollTop = 0;
      if (previewContainerRef.current) previewContainerRef.current.scrollTop = 0;

      // 4. Ajouter aux onglets ouverts s'il n'y est pas déjà
      setOpenTabs((prevTabs) => {
        if (!prevTabs.includes(file.id)) {
          return [...prevTabs, file.id];
        }
        return prevTabs;
      });
    },
    [activeFileId, markdown]
  );

  // Fermeture d'un onglet
  const handleCloseTab = useCallback(
    (tabId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenTabs((prevTabs) => {
        const nextTabs = prevTabs.filter((id) => id !== tabId);
        // Si l'onglet fermé était actif, activer le dernier onglet restant
        if (tabId === activeFileId && nextTabs.length > 0) {
          const nextActiveId = nextTabs[nextTabs.length - 1];
          const nextFile = findItemById(projectTree, nextActiveId);
          if (nextFile) {
            setActiveFileId(nextActiveId);
            setMarkdown(nextFile.content || '');
            setFilename(nextFile.name.replace(/\.(md|markdown|txt|docx)$/i, ''));
          }
        }
        return nextTabs;
      });
    },
    [activeFileId, projectTree]
  );

  // Création d'un nouveau fichier dans le répertoire
  const handleCreateFile = useCallback(
    (parentFolderId: string | null, fileName: string) => {
      const { newTree, createdFile } = createFileInTree(
        projectTree,
        parentFolderId,
        fileName
      );
      setProjectTree(newTree);
      handleSelectFile(createdFile);
      showNotification(`Document « ${createdFile.name} » créé.`);
    },
    [projectTree, handleSelectFile]
  );

  // Création d'un nouveau dossier dans le répertoire
  const handleCreateFolder = useCallback(
    (parentFolderId: string | null, folderName: string) => {
      const newTree = createFolderInTree(projectTree, parentFolderId, folderName);
      setProjectTree(newTree);
      showNotification(`Répertoire « ${folderName} » créé avec succès.`);
    },
    [projectTree]
  );

  // Suppression d'un fichier ou sous-dossier
  const handleDeleteItem = useCallback(
    (itemId: string) => {
      const newTree = deleteItemFromTree(projectTree, itemId);
      setProjectTree(newTree);
      setOpenTabs((prev) => prev.filter((id) => id !== itemId));

      // Si le fichier actif a été supprimé, sélectionner le premier fichier restant
      if (itemId === activeFileId) {
        const remainingFiles = getAllFiles(newTree);
        if (remainingFiles.length > 0) {
          handleSelectFile(remainingFiles[0]);
        } else {
          setMarkdown('');
          setFilename('nouveau-document');
        }
      }
      showNotification('Élément supprimé du répertoire.');
    },
    [projectTree, activeFileId, handleSelectFile]
  );

  // Renommage d'un fichier ou sous-dossier
  const handleRenameItem = useCallback(
    (itemId: string, newName: string) => {
      const newTree = renameItemInTree(projectTree, itemId, newName);
      setProjectTree(newTree);
      if (itemId === activeFileId) {
        setFilename(newName.replace(/\.(md|markdown|txt|docx)$/i, ''));
      }
      showNotification(`Élément renommé en « ${newName} »`);
    },
    [projectTree, activeFileId]
  );

  // Pliage / Dépliage d'un dossier
  const handleToggleFolder = useCallback((folderId: string) => {
    setProjectTree((prev) => toggleFolderInTree(prev, folderId));
  }, []);

  // Importation d'un dossier entier depuis le disque dur de l'utilisateur
  const handleImportDirectory = useCallback(
    async (files: FileList) => {
      try {
        showNotification('Chargement et analyse du répertoire local...', 'info');
        const result = await loadDirectoryFromFiles(files);
        setProjectTree(result.tree);
        setRootName(result.rootName);

        const all = getAllFiles(result.tree);
        if (all.length > 0) {
          const first = all[0];
          setActiveFileId(first.id);
          setMarkdown(first.content || '');
          setFilename(first.name.replace(/\.(md|markdown|txt|docx)$/i, ''));
          setOpenTabs([first.id]);
        }
        showNotification(
          `Répertoire « ${result.rootName} » importé avec succès (${all.length} documents détectés) !`
        );
      } catch (err) {
        console.error('Erreur importation dossier :', err);
        alert('Impossible de charger le dossier sélectionné.');
      }
    },
    []
  );

  // Export groupé de tout le répertoire au format ZIP (avec conversion Word ou Markdown)
  const handleExportZip = useCallback(
    async (exportType: 'docx' | 'markdown' | 'both') => {
      try {
        setIsExporting(true);
        // Sauvegarder d'abord le fichier actif
        const currentTree = updateFileContentInTree(projectTree, activeFileId, markdown);
        setProjectTree(currentTree);

        showNotification(
          `Création de l'archive ZIP (${exportType === 'docx' ? 'documents Word' : 'fichiers Markdown'})...`,
          'info'
        );

        const zipBlob = await exportProjectToZip(
          currentTree,
          rootName,
          exportType,
          options,
          (current, total, currentName) => {
            console.log(`Génération: ${current}/${total} - ${currentName}`);
          }
        );

        const typeSuffix =
          exportType === 'docx'
            ? 'Word_Docx'
            : exportType === 'markdown'
            ? 'Markdown'
            : 'Complet';
        downloadBlob(zipBlob, `${rootName}_${typeSuffix}.zip`);

        showNotification(
          `Archive ZIP « ${rootName}_${typeSuffix}.zip » téléchargée avec succès !`
        );
      } catch (err) {
        console.error('Erreur export ZIP :', err);
        alert("Une erreur est survenue lors de l'exportation du répertoire en ZIP.");
      } finally {
        setIsExporting(false);
      }
    },
    [projectTree, activeFileId, markdown, rootName, options]
  );

  // Réinitialisation vers l'espace de démonstration par défaut
  const handleResetDefaultProject = useCallback(() => {
    if (confirm("Réinitialiser l'arborescence avec le projet de démonstration complet ?")) {
      setProjectTree(DEFAULT_PROJECT_TREE);
      setRootName('Projet_Documentation_2026');
      const first = DEFAULT_PROJECT_TREE[0];
      setActiveFileId(first.id);
      setMarkdown(first.content || '');
      setFilename('00_Index_et_Introduction');
      setOpenTabs(['f-root-intro', 'f-spec-mermaid', 'f-code-services']);
      showNotification('Projet de démonstration réinitialisé.');
    }
  }, []);

  // Chargement d'un modèle prédéfini individuel
  const handleSelectSample = useCallback((sample: MarkdownSample) => {
    setMarkdown(sample.content);
    const cleanName = sample.filename.replace(/\.docx$/i, '');
    setFilename(cleanName);
    setOptions((prev) => ({
      ...prev,
      title: extractTitle(sample.content),
    }));
    if (editorTextareaRef.current) editorTextareaRef.current.scrollTop = 0;
    if (previewContainerRef.current) previewContainerRef.current.scrollTop = 0;
    showNotification(`Modèle « ${sample.name} » chargé avec succès.`);
  }, []);

  // Chargement d'un fichier texte / Markdown depuis le disque
  const handleFileLoaded = useCallback((loadedFilename: string, content: string) => {
    setMarkdown(content);
    const cleanName = loadedFilename.replace(/\.(md|markdown|txt)$/i, '');
    setFilename(cleanName);
    setOptions((prev) => ({
      ...prev,
      title: extractTitle(content),
    }));
    if (editorTextareaRef.current) editorTextareaRef.current.scrollTop = 0;
    if (previewContainerRef.current) previewContainerRef.current.scrollTop = 0;
    showNotification(`Fichier « ${loadedFilename} » importé avec succès.`);
  }, []);

  // Importation et conversion d'un fichier Microsoft Word (.docx) vers Markdown
  const handleImportDocx = useCallback(async (file: File) => {
    try {
      showNotification(`Conversion du fichier Word « ${file.name} » en cours...`, 'info');
      const result = await convertDocxToMarkdown(file);

      if (!result.markdown || result.markdown.trim() === '') {
        alert('Le fichier Word semble vide ou son contenu n’a pas pu être extrait.');
        return;
      }

      setMarkdown(result.markdown);
      const cleanName = file.name.replace(/\.docx$/i, '');
      setFilename(cleanName);

      const extracted = extractTitle(result.markdown);
      setOptions((prev) => ({
        ...prev,
        title: extracted !== 'Document' ? extracted : cleanName,
      }));

      showNotification(`Document Word « ${file.name} » converti en Markdown avec succès !`);
    } catch (err) {
      console.error('Erreur lors de la conversion Word vers Markdown :', err);
      alert('Impossible de lire le fichier Word (.docx). Assurez-vous qu’il s’agit d’un fichier .docx valide.');
    }
  }, []);

  // Export vers document Microsoft Word (.docx) du fichier actif
  const handleExportWord = async () => {
    if (!markdown || markdown.trim() === '') {
      alert('Veuillez insérer du contenu Markdown avant de générer le document Word.');
      return;
    }

    try {
      setIsExporting(true);
      const blob = await generateWordDocument(markdown, options);
      downloadBlob(blob, filename || 'document');
      showNotification(`Document Word « ${filename}.docx » téléchargé avec succès.`);
    } catch (error) {
      console.error('Erreur lors de la création du document Word :', error);
      alert('Une erreur est survenue lors de la génération du document Word.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export vers fichier Markdown (.md) du fichier actif
  const handleExportMarkdown = useCallback(() => {
    if (!markdown || markdown.trim() === '') {
      alert('Le contenu est vide. Rien à enregistrer.');
      return;
    }
    const mdName = filename.endsWith('.md') ? filename : `${filename}.md`;
    downloadMarkdownFile(markdown, mdName);
    showNotification(`Fichier Markdown « ${mdName} » enregistré sur votre poste.`);
  }, [markdown, filename]);

  // Raccourci clavier universel Ctrl + S pour exporter en Word
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleExportWord();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markdown, options, filename]);

  const allProjectFiles = useMemo(() => getAllFiles(projectTree), [projectTree]);

  return (
    <div className="h-screen flex flex-col bg-slate-100/70 text-slate-800 font-sans overflow-hidden">
      {/* En-tête principal avec bouton d'installation PWA Windows */}
      <Header />

      {/* Barre de métriques et statistiques du document */}
      <StatsBar stats={stats} />

      {/* Notification accessible */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`${
            notice.type === 'info' ? 'bg-blue-800' : 'bg-emerald-700'
          } text-white text-xs font-semibold py-1.5 px-4 text-center shadow-xs animate-in fade-in duration-150 flex items-center justify-center gap-2 shrink-0`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* Sélecteur de vue & statut de l'espace de travail */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2 pb-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Bouton pour afficher/masquer le panneau latéral des répertoires */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition shadow-2xs ${
              isSidebarOpen
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
            }`}
            title="Afficher / Masquer l'explorateur de répertoires"
            aria-pressed={isSidebarOpen}
          >
            <FolderTree className="h-3.5 w-3.5 text-blue-700" />
            <span className="font-medium">Répertoire :</span>
            <span className="truncate max-w-[140px] font-bold">{rootName}</span>
          </button>

          {/* Vues : Duo, Éditeur, Aperçu Word */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'split'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              aria-pressed={viewMode === 'split'}
            >
              <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Vue côte à côte</span>
              <span className="sm:hidden">Duo</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'editor'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              aria-pressed={viewMode === 'editor'}
            >
              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Éditeur Markdown</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'preview'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              aria-pressed={viewMode === 'preview'}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Document Lisible (Word)</span>
            </button>
          </div>

          {/* Bouton de bascule pour le défilement synchronisé en mode côte à côte */}
          {viewMode === 'split' && (
            <button
              type="button"
              onClick={() => setIsScrollSynced((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition shadow-2xs ${
                isScrollSynced
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70'
                  : 'bg-white text-slate-500 hover:text-slate-800 border-slate-300'
              }`}
              title={
                isScrollSynced
                  ? 'Défilement synchronisé actif (cliquez pour désactiver)'
                  : 'Défilement synchronisé désactivé (cliquez pour activer)'
              }
              aria-pressed={isScrollSynced}
            >
              {isScrollSynced ? (
                <Link2 className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              ) : (
                <Unlink2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Défilement synchronisé</span>
              <span className="sm:hidden">Synchro</span>
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  isScrollSynced ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Coloration syntaxique active</span>
          </span>
          <span className="hidden lg:inline">
            Raccourci : <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded-md text-[10px] font-mono shadow-2xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded-md text-[10px] font-mono shadow-2xs">S</kbd>
          </span>
        </div>
      </div>

      {/* Zone principale : Explorateur de répertoires + Éditeur + Prévisualisation */}
      <div className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-1 pb-2 flex gap-4">
        {/* Explorateur arborescent de répertoires */}
        <DirectorySidebar
          rootName={rootName}
          items={projectTree}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onToggleFolder={handleToggleFolder}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onDeleteItem={handleDeleteItem}
          onRenameItem={handleRenameItem}
          onImportDirectory={handleImportDirectory}
          onExportZip={handleExportZip}
          onResetDefaultProject={handleResetDefaultProject}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Colonne de travail principale avec barre d'onglets et fil d'Ariane */}
        <div className="flex-1 min-w-0 flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Barre d'onglets des fichiers ouverts */}
          <EditorTabs
            openTabs={openTabs}
            activeFileId={activeFileId}
            allItems={allProjectFiles}
            onSelectTab={(tabId) => {
              const file = findItemById(projectTree, tabId);
              if (file) handleSelectFile(file);
            }}
            onCloseTab={handleCloseTab}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />

          {/* Grille principale : Éditeur et Prévisualisation Word */}
          <main className="flex-1 min-h-0 p-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full min-h-0">
              {/* Colonne Éditeur Markdown */}
              {(viewMode === 'split' || viewMode === 'editor') && (
                <div className={`h-full min-h-0 ${viewMode === 'editor' ? 'lg:col-span-2' : ''}`}>
                  <MarkdownEditor
                    markdown={markdown}
                    onChange={handleMarkdownChange}
                    onSelectSample={handleSelectSample}
                    onFileLoaded={handleFileLoaded}
                    onImportDocx={handleImportDocx}
                    onDownloadMarkdown={handleExportMarkdown}
                    textareaRef={editorTextareaRef}
                    onScroll={handleEditorScroll}
                  />
                </div>
              )}

              {/* Colonne Aperçu Document Lisible / Édition directe */}
              {(viewMode === 'split' || viewMode === 'preview') && (
                <div className={`h-full min-h-0 ${viewMode === 'preview' ? 'lg:col-span-2' : ''}`}>
                  <DocumentPreview
                    markdown={markdown}
                    options={options}
                    onMarkdownChange={handleMarkdownChange}
                    onImportDocx={handleImportDocx}
                    scrollContainerRef={previewContainerRef}
                    onScroll={handlePreviewScroll}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Barre inférieure d'exportation vers Word et Markdown - Ancrée et toujours visible */}
      <div className="shrink-0">
        <ExportToolbar
          options={options}
          onOptionsChange={setOptions}
          filename={filename}
          onFilenameChange={setFilename}
          onExportWord={handleExportWord}
          onExportMarkdown={handleExportMarkdown}
          isExporting={isExporting}
        />
      </div>
    </div>
  );
}
