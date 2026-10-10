import React, { useMemo, useRef, useEffect, useState } from 'react';
import { renderSecureMarkdown } from '../utils/markdownParser';
import { convertHtmlToMarkdown } from '../utils/docxToMarkdown';
import { paginateMarkdown } from '../utils/pageSplitter';
import { DocumentOptions, DocumentTheme } from '../types';
import { FileText, Eye, Printer, Edit3, Check, Upload, BookOpen } from 'lucide-react';

interface DocumentPreviewProps {
  markdown: string;
  options: DocumentOptions;
  onMarkdownChange: (newMarkdown: string) => void;
  onImportDocx: (file: File) => void;
}

const THEME_FONTS: Record<DocumentTheme, string> = {
  modern: 'font-sans', // Calibri / Sans-serif moderne
  academic: 'font-serif', // Georgia / Serif élégant
  technical: 'font-sans', // Segoe UI / Tech
  minimal: 'font-sans', // Arial
};

const THEME_HEADER_COLORS: Record<DocumentTheme, string> = {
  modern: 'text-blue-900',
  academic: 'text-slate-900',
  technical: 'text-teal-900',
  minimal: 'text-zinc-900',
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  markdown,
  options,
  onMarkdownChange,
  onImportDocx,
}) => {
  const [isDirectEditing, setIsDirectEditing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);

  // Rendu HTML sécurisé (pour le mode édition globale)
  const htmlContent = useMemo(() => {
    return renderSecureMarkdown(markdown);
  }, [markdown]);

  // Découpage automatique en pages A4 pour la prévisualisation réaliste
  const pages = useMemo(() => {
    return paginateMarkdown(markdown);
  }, [markdown]);

  // Synchronisation du DOM en mode édition directe
  useEffect(() => {
    if (isDirectEditing && editableRef.current && !isTypingRef.current) {
      editableRef.current.innerHTML = htmlContent;
    }
  }, [htmlContent, isDirectEditing]);

  const toggleDirectEditing = () => {
    setIsDirectEditing((prev) => {
      const next = !prev;
      if (next && editableRef.current) {
        editableRef.current.innerHTML = htmlContent;
      }
      return next;
    });
  };

  // Gestion de la saisie directe sur la feuille Word (contentEditable)
  const handleInput = () => {
    if (!editableRef.current) return;
    isTypingRef.current = true;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (editableRef.current) {
        const rawHtml = editableRef.current.innerHTML;
        const convertedMarkdown = convertHtmlToMarkdown(rawHtml);
        onMarkdownChange(convertedMarkdown);
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 2000);
      }
      isTypingRef.current = false;
    }, 300);
  };

  const handleDocxFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportDocx(e.target.files[0]);
    }
  };

  const fontClass = THEME_FONTS[options.theme] || 'font-sans';
  const headerColor = THEME_HEADER_COLORS[options.theme] || 'text-blue-900';
  const totalPages = pages.length;

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Barre d'action de l'aperçu */}
      <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Eye className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Document Lisible (Word)</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                <BookOpen className="h-3 w-3" />
                {totalPages} {totalPages > 1 ? 'pages A4' : 'page A4'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Format A4 avec pagination continue & tableaux bordés
            </p>
          </div>
        </div>

        {/* Contrôles d'action sur le document */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Input masqué pour charger un .docx */}
          <input
            ref={docxInputRef}
            type="file"
            accept=".docx"
            onChange={handleDocxFileChange}
            className="hidden"
            id="docx-direct-input"
            aria-label="Charger un fichier Word .docx"
          />

          <button
            type="button"
            onClick={() => docxInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 rounded-lg transition shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            title="Charger un document Word (.docx) pour le convertir en Markdown"
          >
            <Upload className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            <span>Charger un Word (.docx)</span>
          </button>

          {/* Bouton pour activer / désactiver l'édition directe */}
          <button
            type="button"
            onClick={toggleDirectEditing}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition border shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-none ${
              isDirectEditing
                ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-200'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
            }`}
            title={
              isDirectEditing
                ? "Désactiver l'édition directe"
                : 'Modifier le texte directement sur la feuille Word'
            }
            aria-pressed={isDirectEditing}
          >
            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isDirectEditing ? 'Édition directe active' : 'Modifier la page'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Imprimer ou enregistrer en PDF"
            aria-label="Imprimer le document"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bannière informative si le mode édition directe est activé */}
      {isDirectEditing && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between text-xs text-amber-900 animate-in fade-in duration-150 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Mode édition directe : vous pouvez taper et modifier le document directement ci-dessous.
          </span>
          {justSynced && (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
              <Check className="h-3.5 w-3.5" /> Synchronisé en Markdown
            </span>
          )}
        </div>
      )}

      {/* Conteneur défilant des pages A4 Word */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        {/* Mode 1 : Édition directe active (une seule feuille globale continue pour faciliter la frappe) */}
        {isDirectEditing ? (
          <article
            className={`word-page-sheet ${fontClass}`}
            aria-label="Aperçu du document éditable"
          >
            {/* En-tête de page simulé Word */}
            <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center text-xs text-slate-400 select-none">
              <span>{options.author || 'Document bureautique'}</span>
              <span className="truncate max-w-[240px] text-right font-medium text-slate-500">
                {options.title || 'Document Word'}
              </span>
            </div>

            {/* Corps éditable contentEditable */}
            <div
              ref={editableRef}
              contentEditable={true}
              suppressContentEditableWarning={true}
              onInput={handleInput}
              className={`flex-1 prose prose-slate max-w-none outline-none prose-headings:${headerColor} prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-2 prose-h2:text-xl prose-h2:font-bold prose-h2:mt-6 prose-h3:text-lg prose-h3:font-semibold prose-p:leading-relaxed prose-table:border-collapse prose-th:bg-blue-900 prose-th:text-white prose-blockquote:border-l-4 prose-blockquote:border-blue-700 prose-blockquote:bg-slate-50/50 prose-blockquote:p-3 prose-blockquote:rounded-r-lg prose-code:font-mono prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl cursor-text ring-1 ring-amber-300 p-2 rounded-lg bg-amber-50/10`}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Pied de page */}
            {options.includePageNumbers && (
              <div className="border-t border-slate-200 pt-4 mt-8 flex justify-between items-center text-xs text-slate-500 select-none">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <FileText className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                  <span>Format Microsoft Word (.docx)</span>
                </div>
                <span className="font-semibold text-slate-700">Page 1 sur 1 (Édition)</span>
              </div>
            )}
          </article>
        ) : (
          /* Mode 2 : Prévisualisation paginée Word fidèle (plusieurs feuilles A4 séparées) */
          pages.map((page) => (
            <article
              key={`page-${page.pageIndex}`}
              className={`word-page-sheet ${fontClass}`}
              aria-label={`Page ${page.pageIndex} sur ${totalPages}`}
            >
              {/* En-tête de page Word */}
              <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center text-xs text-slate-400 select-none">
                <span>{options.author || 'Document bureautique'}</span>
                <span className="truncate max-w-[240px] text-right font-medium text-slate-500">
                  {options.title || 'Document Word'}
                </span>
              </div>

              {/* Contenu rendu de la page courante */}
              <div
                className={`flex-1 prose prose-slate max-w-none prose-headings:${headerColor} prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-2 prose-h2:text-xl prose-h2:font-bold prose-h2:mt-6 prose-h3:text-lg prose-h3:font-semibold prose-p:leading-relaxed prose-table:border-collapse prose-th:bg-blue-900 prose-th:text-white prose-blockquote:border-l-4 prose-blockquote:border-blue-700 prose-blockquote:bg-slate-50/50 prose-blockquote:p-3 prose-blockquote:rounded-r-lg prose-code:font-mono prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl`}
                dangerouslySetInnerHTML={{ __html: page.html }}
              />

              {/* Pied de page Word avec numérotation Page X sur Y */}
              {options.includePageNumbers && (
                <div className="border-t border-slate-200 pt-4 mt-8 flex justify-between items-center text-xs text-slate-500 select-none">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <FileText className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                    <span>Format Microsoft Word (.docx)</span>
                  </div>
                  <span className="font-semibold text-slate-700">
                    Page {page.pageIndex} sur {totalPages}
                  </span>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
};
