/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { MarkdownEditor } from './components/MarkdownEditor';
import { DocumentPreview } from './components/DocumentPreview';
import { ExportToolbar } from './components/ExportToolbar';
import { SAMPLES, MarkdownSample } from './utils/samples';
import { calculateDocumentStats, extractTitle } from './utils/markdownParser';
import { generateWordDocument, downloadBlob } from './utils/wordGenerator';
import { convertDocxToMarkdown, downloadMarkdownFile } from './utils/docxToMarkdown';
import { DocumentOptions } from './types';
import { Columns2, Edit3, Eye, ArrowLeftRight } from 'lucide-react';

export default function App() {
  // Chargement du premier exemple complet par défaut
  const [markdown, setMarkdown] = useState<string>(SAMPLES[0].content);
  const [filename, setFilename] = useState<string>('Rapport_Activite_2026');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Options de document pour l'export Word
  const [options, setOptions] = useState<DocumentOptions>({
    title: "Rapport Annuel d'Activité et Performance 2026",
    author: 'Direction des Systèmes d’Information',
    includePageNumbers: true,
    theme: 'modern',
    fontSize: 11,
    lineSpacing: 1.15,
  });

  // Calcul des statistiques du document
  const stats = useMemo(() => {
    return calculateDocumentStats(markdown);
  }, [markdown]);

  const showNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4500);
  };

  // Chargement d'un modèle prédéfini
  const handleSelectSample = useCallback((sample: MarkdownSample) => {
    setMarkdown(sample.content);
    const cleanName = sample.filename.replace(/\.docx$/i, '');
    setFilename(cleanName);
    setOptions((prev) => ({
      ...prev,
      title: extractTitle(sample.content),
    }));
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
    showNotification(`Fichier Markdown « ${loadedFilename} » importé avec succès.`);
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

  // Export vers document Microsoft Word (.docx)
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

  // Export vers fichier Markdown (.md)
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

      {/* Sélecteur de vue (Écran partagé, Éditeur seul, Aperçu seul) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2.5 pb-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
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

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs font-medium text-slate-700">
            <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
            <span>Conversion bidirectionnelle Markdown ⇄ Word</span>
          </span>
          <span className="hidden lg:inline">
            Raccourci : <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded-md text-[10px] font-mono shadow-2xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded-md text-[10px] font-mono shadow-2xs">S</kbd>
          </span>
        </div>
      </div>

      {/* Zone principale : Éditeur et Prévisualisation */}
      <main className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-1 pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full min-h-0">
          {/* Colonne Éditeur Markdown */}
          {(viewMode === 'split' || viewMode === 'editor') && (
            <div className={`h-full min-h-0 ${viewMode === 'editor' ? 'lg:col-span-2' : ''}`}>
              <MarkdownEditor
                markdown={markdown}
                onChange={setMarkdown}
                onSelectSample={handleSelectSample}
                onFileLoaded={handleFileLoaded}
                onImportDocx={handleImportDocx}
                onDownloadMarkdown={handleExportMarkdown}
              />
            </div>
          )}

          {/* Colonne Aperçu Document Lisible / Édition directe */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className={`h-full min-h-0 ${viewMode === 'preview' ? 'lg:col-span-2' : ''}`}>
              <DocumentPreview
                markdown={markdown}
                options={options}
                onMarkdownChange={setMarkdown}
                onImportDocx={handleImportDocx}
              />
            </div>
          )}
        </div>
      </main>

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
