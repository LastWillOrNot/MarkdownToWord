import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

/**
 * Configure le service Turndown pour une conversion HTML vers Markdown optimale
 */
function createTurndownService(): TurndownService {
  const turndownService = new TurndownService({
    headingStyle: 'atx', // Génère # Titre, ## Sous-titre
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });

  // Activer les tables et les listes de tâches GFM
  turndownService.use(gfm);

  // Règle de préservation pour les diagrammes Mermaid lors de l'édition directe
  turndownService.addRule('mermaidDiagram', {
    filter: (node) => {
      if (node.nodeName === 'DIV') {
        const el = node as HTMLElement;
        return (
          el.hasAttribute('data-mermaid-code') ||
          (el.className && el.className.includes('mermaid-diagram-card')) ||
          (el.className && el.className.includes('mermaid-diagram-error'))
        );
      }
      return false;
    },
    replacement: (_content: string, node: Node) => {
      const el = node as HTMLElement;
      const rawCode = el.getAttribute('data-mermaid-code') || '';
      if (!rawCode) return '';
      try {
        const decoded = decodeURIComponent(rawCode);
        return `\n\n\`\`\`mermaid\n${decoded.trim()}\n\`\`\`\n\n`;
      } catch {
        return `\n\n\`\`\`mermaid\n${rawCode.trim()}\n\`\`\`\n\n`;
      }
    },
  });

  // Règle de préservation pour les blocs de code avec coloration syntaxique
  turndownService.addRule('codeBlockCard', {
    filter: (node) => {
      if (node.nodeName === 'DIV') {
        const el = node as HTMLElement;
        return (
          el.hasAttribute('data-code-block') ||
          (el.className && el.className.includes('code-block-card'))
        );
      }
      return false;
    },
    replacement: (_content: string, node: Node) => {
      const el = node as HTMLElement;
      const codeEl = el.querySelector('code');
      const text = codeEl ? codeEl.textContent || '' : '';
      const langEl = el.querySelector('.code-block-header span');
      const langText = langEl ? langEl.textContent?.trim().toLowerCase() : '';
      const cleanLang = langText && langText !== 'code' ? langText : '';
      return `\n\n\`\`\`${cleanLang}\n${text.trim()}\n\`\`\`\n\n`;
    },
  });

  // Règles personnalisées pour un Markdown soigné
  turndownService.addRule('cleanParagraphs', {
    filter: 'p',
    replacement: (content: string) => {
      const trimmed = content.trim();
      return trimmed ? `\n\n${trimmed}\n\n` : '';
    },
  });

  return turndownService;
}

export interface DocxConversionResult {
  markdown: string;
  messages: string[];
}

/**
 * Convertit un fichier Microsoft Word (.docx) en chaîne Markdown GFM.
 * Effectué 100% côté client de manière sécurisée et isolée.
 */
export async function convertDocxToMarkdown(
  fileOrBuffer: File | ArrayBuffer
): Promise<DocxConversionResult> {
  const arrayBuffer =
    fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;

  // Conversion docx -> HTML sémantique via Mammoth
  const conversionResult = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h3:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
        "p[style-name='Intense Quote'] => blockquote:fresh",
      ],
    }
  );

  const rawHtml = conversionResult.value;
  const messages = conversionResult.messages.map((m) => m.message);

  // Conversion HTML -> Markdown GFM
  const turndownService = createTurndownService();
  let markdown = turndownService.turndown(rawHtml);

  // Nettoyage des sauts de lignes multiples excessifs
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    markdown,
    messages,
  };
}

/**
 * Convertit un contenu HTML (issu de l'édition directe du document Word) en Markdown GFM
 */
export function convertHtmlToMarkdown(html: string): string {
  const turndownService = createTurndownService();
  let markdown = turndownService.turndown(html);
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
  return markdown;
}

/**
 * Déclenche le téléchargement d'un fichier Markdown (.md) côté client
 */
export function downloadMarkdownFile(content: string, filename: string): void {
  const cleanFilename = filename.endsWith('.md')
    ? filename
    : filename.replace(/\.docx$/i, '') + '.md';

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = cleanFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
