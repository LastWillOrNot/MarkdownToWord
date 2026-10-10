import React, { useState } from 'react';
import { Download, Check, Sparkles, FileDown, Settings2, Palette } from 'lucide-react';
import { DocumentOptions, DocumentTheme } from '../types';

interface ExportToolbarProps {
  options: DocumentOptions;
  onOptionsChange: (options: DocumentOptions) => void;
  filename: string;
  onFilenameChange: (filename: string) => void;
  onExportWord: () => Promise<void>;
  onExportMarkdown: () => void;
  isExporting: boolean;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  options,
  onOptionsChange,
  filename,
  onFilenameChange,
  onExportWord,
  onExportMarkdown,
  isExporting,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [mdDownloadSuccess, setMdDownloadSuccess] = useState(false);

  const handleExportClick = async () => {
    try {
      await onExportWord();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error("Erreur lors de l'export Word :", err);
    }
  };

  const handleExportMarkdownClick = () => {
    onExportMarkdown();
    setMdDownloadSuccess(true);
    setTimeout(() => setMdDownloadSuccess(false), 3500);
  };

  return (
    <section
      aria-label="Configuration d'exportation Word"
      className="bg-white border-t border-slate-200 p-3 sm:p-4 shadow-md z-20"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Paramètres principaux : Nom du fichier et métadonnées */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="docx-filename" className="block text-xs font-semibold text-slate-700 mb-1">
              Nom du document Word à télécharger :
            </label>
            <div className="relative flex items-center">
              <input
                id="docx-filename"
                type="text"
                value={filename}
                onChange={(e) => onFilenameChange(e.target.value)}
                placeholder="mon-document.docx"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition shadow-2xs"
              />
              <span className="absolute right-3 text-xs font-bold text-blue-700 pointer-events-none">
                .docx
              </span>
            </div>
          </div>

          <div className="w-44">
            <label htmlFor="theme-select" className="block text-xs font-semibold text-slate-700 mb-1">
              Thème & Style Word :
            </label>
            <div className="relative">
              <select
                id="theme-select"
                value={options.theme}
                onChange={(e) =>
                  onOptionsChange({
                    ...options,
                    theme: e.target.value as DocumentTheme,
                  })
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition cursor-pointer shadow-2xs"
              >
                <option value="modern">Moderne (Bleu / Calibri)</option>
                <option value="academic">Académique (Georgia)</option>
                <option value="technical">Technique (Teal / Segoe)</option>
                <option value="minimal">Minimaliste (Arial / Gris)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mt-5 md:mt-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            aria-expanded={showAdvanced}
            aria-label="Options avancées de mise en page"
          >
            <Settings2 className="h-4 w-4 text-slate-500" />
            <span>Options</span>
          </button>
        </div>

        {/* Boutons d'exportation : Word (.docx) et Markdown (.md) */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleExportMarkdownClick}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition active:scale-[0.98] border focus:ring-4 focus:ring-slate-300 focus:outline-none ${
              mdDownloadSuccess
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white text-slate-800 hover:bg-slate-50 border-slate-300'
            }`}
            title="Enregistrer le document au format Markdown (.md)"
            aria-live="polite"
          >
            {mdDownloadSuccess ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Markdown enregistré !</span>
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 text-slate-700" aria-hidden="true" />
                <span>Enregistrer Markdown (.md)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportClick}
            disabled={isExporting}
            className={`flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition active:scale-[0.98] focus:ring-4 focus:ring-blue-300 focus:outline-none ${
              downloadSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400'
            }`}
            title="Télécharger le document au format Microsoft Word (.docx)"
            aria-live="polite"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Génération du .docx...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Word téléchargé !</span>
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" aria-hidden="true" />
                <span>Télécharger Word (.docx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Panneau des options avancées repliable */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label htmlFor="doc-title-input" className="block font-semibold text-slate-700 mb-1">
              Titre dans l'en-tête du document :
            </label>
            <input
              id="doc-title-input"
              type="text"
              value={options.title}
              onChange={(e) => onOptionsChange({ ...options, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
              placeholder="Titre du document"
            />
          </div>

          <div>
            <label htmlFor="doc-author-input" className="block font-semibold text-slate-700 mb-1">
              Auteur / Émetteur du document :
            </label>
            <input
              id="doc-author-input"
              type="text"
              value={options.author}
              onChange={(e) => onOptionsChange({ ...options, author: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
              placeholder="Ex: Direction des Projets"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none pb-1">
              <input
                type="checkbox"
                checked={options.includePageNumbers}
                onChange={(e) =>
                  onOptionsChange({
                    ...options,
                    includePageNumbers: e.target.checked,
                  })
                }
                className="rounded border-slate-300 text-blue-700 focus:ring-blue-600 h-4 w-4"
              />
              <span>Ajouter la numérotation des pages (Page X sur Y)</span>
            </label>
          </div>
        </div>
      )}
    </section>
  );
};
