import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { DocumentStats } from '../types';
import {
  extractMermaidBlocks,
  renderAllMermaidBlocks,
  injectMermaidHtml,
} from './mermaidRenderer';

/**
 * Configure les options de parsing Markdown avec coloration syntaxique highlight.js
 */
marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      // Les blocs Mermaid sont préservés pour être transformés en SVG interactifs
      if (lang === 'mermaid') {
        return `<pre><code class="language-mermaid">${text}</code></pre>`;
      }

      const rawLang = (lang || '').trim().toLowerCase();
      const validLanguage = rawLang && hljs.getLanguage(rawLang) ? rawLang : undefined;
      let highlighted = '';

      try {
        if (validLanguage) {
          highlighted = hljs.highlight(text, { language: validLanguage }).value;
        } else {
          highlighted = hljs.highlightAuto(text).value;
        }
      } catch {
        // Fallback sécurisé en cas d'erreur de parsing
        highlighted = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }

      const displayLang = (validLanguage || rawLang || 'code').toUpperCase();
      const lines = text.split('\n');
      const linesCount = lines.length;

      return `
        <div class="code-block-card not-prose my-4" data-code-block="true">
          <div class="code-block-header">
            <span class="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-400 font-mono tracking-wider">
              <span class="w-2 h-2 rounded-full bg-sky-400"></span>
              ${displayLang}
            </span>
            <span class="text-[11px] text-slate-400 font-mono font-medium">${linesCount} ${linesCount > 1 ? 'lignes' : 'ligne'}</span>
          </div>
          <div class="code-block-content">
            <pre class="hljs"><code class="hljs language-${validLanguage || 'plaintext'}">${highlighted}</code></pre>
          </div>
        </div>
      `;
    },
  },
});

/**
 * Nettoie et transforme le code Markdown en HTML sécurisé.
 * Intègre la coloration syntaxique et le support des diagrammes Mermaid avec assainissement rigoureux anti-XSS.
 */
export function renderSecureMarkdown(
  markdown: string,
  mermaidMap?: Map<string, string>
): string {
  if (!markdown || markdown.trim() === '') {
    return '<p class="text-slate-400 italic">Aucun contenu à prévisualiser.</p>';
  }

  try {
    const { templateMarkdown, blocks } = extractMermaidBlocks(markdown);
    const rawHtml = marked.parse(templateMarkdown) as string;

    // Configuration stricte de DOMPurify autorisant les balises de coloration syntaxique hljs
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true, svg: true },
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onmouseover'],
      ADD_TAGS: ['div', 'span', 'hr', 'pre', 'code'],
      ADD_ATTR: [
        'class',
        'style',
        'data-mermaid-id',
        'data-mermaid-code',
        'data-code-block',
      ],
    });

    if (blocks.length === 0) {
      return cleanHtml;
    }

    // Si la table de rendu Mermaid est disponible, injecter les SVGs
    if (mermaidMap && mermaidMap.size > 0) {
      return injectMermaidHtml(cleanHtml, mermaidMap);
    }

    // Sinon, afficher un conteneur d'attente soigné
    return cleanHtml.replace(
      /<div class="mermaid-block-placeholder" data-mermaid-id="([^"]+)"><\/div>/g,
      (_match, id) => {
        const blk = blocks.find((b) => b.id === id);
        const code = blk ? blk.code : '';
        const safeCode = encodeURIComponent(code);
        return `
          <div class="mermaid-diagram-card not-prose my-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-center select-none" data-mermaid-code="${safeCode}">
            <div class="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 py-3">
              <span class="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Génération du diagramme Mermaid en cours...</span>
            </div>
          </div>
        `;
      }
    );
  } catch (error) {
    console.error('Erreur lors du rendu du Markdown :', error);
    return '<p class="text-red-500 font-medium">Erreur lors de la lecture du format Markdown.</p>';
  }
}

/**
 * Rendu asynchrone complet avec exécution du moteur Mermaid
 */
export async function renderSecureMarkdownWithMermaid(markdown: string): Promise<string> {
  const { blocks } = extractMermaidBlocks(markdown);
  if (blocks.length === 0) {
    return renderSecureMarkdown(markdown);
  }
  const mermaidMap = await renderAllMermaidBlocks(blocks);
  return renderSecureMarkdown(markdown, mermaidMap);
}

/**
 * Calcule les statistiques d'un texte Markdown
 */
export function calculateDocumentStats(markdown: string): DocumentStats {
  if (!markdown || markdown.trim() === '') {
    return {
      words: 0,
      characters: 0,
      readingTimeMinutes: 0,
      headingsCount: 0,
      tablesCount: 0,
    };
  }

  // Nettoyage sommaire des balises Markdown pour compter les mots réels
  const cleanText = markdown
    .replace(/```[\s\S]*?```/g, ' ') // Blocs de code
    .replace(/`.*?`/g, ' ') // Code inline
    .replace(/#+\s+/g, '') // Titres
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Liens
    .replace(/[*_~>]/g, '') // Gras, italique, citations
    .replace(/\|/g, ' ') // Tableaux
    .replace(/-{3,}/g, ''); // Séparateurs

  const words = cleanText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const characters = markdown.length;

  // Estimation du temps de lecture : ~200 mots par minute
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  // Comptage des titres (# Titre)
  const headingsMatches = markdown.match(/^#{1,6}\s+.+$/gm);
  const headingsCount = headingsMatches ? headingsMatches.length : 0;

  // Comptage des tableaux (lignes de séparation | --- |)
  const tablesMatches = markdown.match(/^\|?\s*:?-+:?\s*\|/gm);
  const tablesCount = tablesMatches ? tablesMatches.length : 0;

  return {
    words,
    characters,
    readingTimeMinutes,
    headingsCount,
    tablesCount,
  };
}

/**
 * Extrait le titre principal du document Markdown (le premier titre # Titre trouvé)
 */
export function extractTitle(markdown: string): string {
  if (!markdown) return 'Document';
  const match = markdown.match(/^#\s+(.+)$/m);
  if (match && match[1]) {
    return match[1].trim();
  }
  const subMatch = markdown.match(/^##\s+(.+)$/m);
  if (subMatch && subMatch[1]) {
    return subMatch[1].trim();
  }
  return 'Document Word';
}
