import React, { useRef, useState } from 'react';
import {
  Upload,
  FileCode,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Table as TableIcon,
  Trash2,
  Copy,
  Check,
  FileText,
  Download,
  FileDown,
  Minus,
  SplitSquareVertical,
} from 'lucide-react';
import { SAMPLES, MarkdownSample } from '../utils/samples';

interface MarkdownEditorProps {
  markdown: string;
  onChange: (value: string) => void;
  onSelectSample: (sample: MarkdownSample) => void;
  onFileLoaded: (filename: string, content: string) => void;
  onImportDocx: (file: File) => void;
  onDownloadMarkdown: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdown,
  onChange,
  onSelectSample,
  onFileLoaded,
  onImportDocx,
  onDownloadMarkdown,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gestion du glisser-déposer de fichiers (.md ou .docx)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (file.name.toLowerCase().endsWith('.docx')) {
      onImportDocx(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        onFileLoaded(file.name, content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDocxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportDocx(e.target.files[0]);
    }
  };

  // Insertion d'éléments Markdown à la position du curseur
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end) || defaultText;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newValue =
      textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 10);
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignorer si l'accès clipboard échoue
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-white rounded-2xl border transition shadow-xs ${
        isDragging ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20' : 'border-slate-200'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Barre supérieure : Import & Modèles */}
      <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/70 rounded-t-2xl">
        <div className="flex items-center flex-wrap gap-2">
          {/* Input pour fichier Markdown */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,.text"
            onChange={handleFileChange}
            className="hidden"
            id="markdown-file-input"
            aria-label="Sélectionner un fichier Markdown à importer"
          />

          {/* Input pour document Word (.docx) */}
          <input
            ref={docxInputRef}
            type="file"
            accept=".docx"
            onChange={handleDocxChange}
            className="hidden"
            id="docx-file-input"
            aria-label="Sélectionner un document Word .docx à convertir en Markdown"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            title="Importer un fichier Markdown (.md) depuis votre ordinateur"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <span>Importer .md</span>
          </button>

          <button
            type="button"
            onClick={() => docxInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            title="Importer un document Word (.docx) et le convertir automatiquement en Markdown"
          >
            <FileText className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            <span>Importer .docx</span>
          </button>

          {/* Menu déroulant de modèles prêts à l'emploi */}
          <div className="relative group">
            <select
              aria-label="Charger un modèle de document"
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              defaultValue=""
              onChange={(e) => {
                const sample = SAMPLES.find((s) => s.id === e.target.value);
                if (sample) onSelectSample(sample);
                e.target.value = '';
              }}
            >
              <option value="" disabled>
                Exemples de modèles...
              </option>
              {SAMPLES.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  Modèle : {sample.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDownloadMarkdown}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            title="Télécharger / Enregistrer le fichier Markdown (.md)"
            aria-label="Enregistrer le fichier Markdown"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-700" />
            <span>Enregistrer .md</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition"
            title="Copier le code Markdown"
            aria-label="Copier le texte Markdown"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
            title="Effacer tout le contenu"
            aria-label="Effacer le texte Markdown"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Barre d'outils de formatage Markdown rapide */}
      <div
        className="px-3 py-1.5 border-b border-slate-100 flex flex-wrap items-center gap-1 bg-white text-slate-600 text-xs"
        role="toolbar"
        aria-label="Outils d'édition Markdown"
      >
        <button
          type="button"
          onClick={() => insertFormatting('**', '**', 'texte en gras')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-md transition"
          title="Gras (**texte**)"
          aria-label="Gras"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('*', '*', 'texte en italique')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-md transition"
          title="Italique (*texte*)"
          aria-label="Italique"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => insertFormatting('# ', '', 'Grand Titre')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-md transition"
          title="Titre de niveau 1 (# Titre)"
          aria-label="Titre niveau 1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('## ', '', 'Sous-titre')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-md transition"
          title="Titre de niveau 2 (## Sous-titre)"
          aria-label="Titre niveau 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => insertFormatting('- ', '', 'Élément de liste')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-md transition"
          title="Liste à puces (- élément)"
          aria-label="Liste à puces"
        >
          <List className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('1. ', '', 'Élément numéroté')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-md transition"
          title="Liste numérotée (1. élément)"
          aria-label="Liste numérotée"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('> ', '', 'Citation importante')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-md transition"
          title="Citation (> texte)"
          aria-label="Citation"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('```text\n', '\n```', 'code ou commande')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-md transition"
          title="Bloc de code (```)"
          aria-label="Bloc de code"
        >
          <Code className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() =>
            insertFormatting(
              '\n| Colonne 1 | Colonne 2 | Colonne 3 |\n| :--- | :--- | :--- |\n| Donnée A | Donnée B | Donnée C |\n',
              '',
              ''
            )
          }
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-md transition"
          title="Insérer un tableau Markdown"
          aria-label="Tableau"
        >
          <TableIcon className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('\n\n---\n\n', '', '')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-md transition"
          title="Insérer un séparateur de section (---)"
          aria-label="Séparateur"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('\n\n<div class="page-break"></div>\n\n', '', '')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-md transition text-blue-700"
          title="Insérer un saut de page Word explicite"
          aria-label="Saut de page"
        >
          <SplitSquareVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Zone d'édition texte */}
      <div className="relative flex-1 min-h-[360px] p-3">
        <label htmlFor="markdown-textarea" className="sr-only">
          Contenu du fichier Markdown
        </label>
        <textarea
          id="markdown-textarea"
          ref={textareaRef}
          value={markdown}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Glissez-déposez un fichier Markdown ici (.md), collez votre texte ou commencez à taper..."
          className="w-full h-full resize-none font-mono text-[13px] leading-relaxed text-slate-800 focus:outline-none placeholder:text-slate-400 p-2"
          spellCheck={false}
        />

        {markdown.trim() === '' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <FileCode className="h-12 w-12 text-slate-300 mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-600">
              Glissez-déposez un fichier .md ici ou commencez à écrire
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Vous pouvez aussi tester immédiatement un modèle prêt à l'emploi avec le menu ci-dessus.
            </p>
          </div>
        )}
      </div>

      {/* Pied de l'éditeur */}
      <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl text-[11px] text-slate-500 flex justify-between items-center">
        <span>Glissez-déposez un fichier .md ou .txt</span>
        <span>Syntaxe Markdown GFM</span>
      </div>
    </div>
  );
};
