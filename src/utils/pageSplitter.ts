import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  extractMermaidBlocks,
  renderAllMermaidBlocks,
  injectMermaidHtml,
} from './mermaidRenderer';

export interface DocumentPage {
  pageIndex: number;
  html: string;
}

// Hauteur utile estimée en pixels pour une feuille A4 Word avant débordement (zone de contenu)
const PAGE_TARGET_CAPACITY = 1600;

/**
 * Découpe un document Markdown en une succession de pages A4 Word fidèles.
 * Fonctionnement :
 * - Respecte d'abord les sauts de page explicites (<div class="page-break"></div> ou <!-- pagebreak -->)
 * - Découpe également les sections très longues pour éviter que le texte ne s'étire indéfiniment sur une seule page Word
 * - Purifie et sécurise chaque fragment HTML
 * - Injecte les diagrammes Mermaid rendus
 */
export function paginateMarkdown(
  markdown: string,
  mermaidMap?: Map<string, string>
): DocumentPage[] {
  if (!markdown || markdown.trim() === '') {
    return [
      {
        pageIndex: 1,
        html: '<p class="text-slate-400 italic">Aucun contenu à prévisualiser.</p>',
      },
    ];
  }

  // 1. Extraction des blocs Mermaid sous forme d'emplacements stables
  const { templateMarkdown, blocks } = extractMermaidBlocks(markdown);

  // 2. Découpage par sauts explicites
  const explicitBreaks = /(?:<div\s+class=["'][^"']*page-break[^"']*["']\s*>\s*<\/div>|<!--\s*page-?break\s*-->)/gi;
  const rawSections = templateMarkdown.split(explicitBreaks);

  const rawChunks: string[] = [];

  for (const section of rawSections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // Si la section contient des séparateurs '---' ou des grands titres # qui dépassent une page
    if (trimmed.length > PAGE_TARGET_CAPACITY) {
      // Découper selon les lignes de séparateurs '---' ou titres de niveau 1 ou 2
      const blocksList = trimmed.split(/(?=\n#{1,2}\s+|\n---\n)/g);
      let currentChunk = '';

      for (const block of blocksList) {
        if (!currentChunk) {
          currentChunk = block.trim();
        } else if (currentChunk.length + block.length > PAGE_TARGET_CAPACITY) {
          rawChunks.push(currentChunk);
          currentChunk = block.trim();
        } else {
          currentChunk += '\n\n' + block.trim();
        }
      }

      if (currentChunk.trim()) {
        rawChunks.push(currentChunk.trim());
      }
    } else {
      rawChunks.push(trimmed);
    }
  }

  if (rawChunks.length === 0) {
    rawChunks.push(templateMarkdown);
  }

  // 3. Transformation en HTML assaini avec réinjection Mermaid
  return rawChunks.map((chunk, index) => {
    try {
      const rawHtml = marked.parse(chunk) as string;
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'data-action'],
        ADD_TAGS: ['div', 'span', 'hr'],
        ADD_ATTR: ['class', 'style', 'data-mermaid-id'],
      });

      let finalHtml = cleanHtml;
      if (mermaidMap && mermaidMap.size > 0) {
        finalHtml = injectMermaidHtml(cleanHtml, mermaidMap);
      } else if (blocks.length > 0) {
        finalHtml = cleanHtml.replace(
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
      }

      return {
        pageIndex: index + 1,
        html: finalHtml,
      };
    } catch {
      return {
        pageIndex: index + 1,
        html: '<p class="text-red-500">Erreur lors du rendu de la page.</p>',
      };
    }
  });
}

/**
 * Version asynchrone qui effectue la résolution complète des diagrammes Mermaid
 */
export async function paginateMarkdownWithMermaid(markdown: string): Promise<DocumentPage[]> {
  const { blocks } = extractMermaidBlocks(markdown);
  if (blocks.length === 0) {
    return paginateMarkdown(markdown);
  }
  const mermaidMap = await renderAllMermaidBlocks(blocks);
  return paginateMarkdown(markdown, mermaidMap);
}

