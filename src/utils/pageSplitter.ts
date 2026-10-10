import { marked } from 'marked';
import DOMPurify from 'dompurify';

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
 */
export function paginateMarkdown(markdown: string): DocumentPage[] {
  if (!markdown || markdown.trim() === '') {
    return [
      {
        pageIndex: 1,
        html: '<p class="text-slate-400 italic">Aucun contenu à prévisualiser.</p>',
      },
    ];
  }

  // 1. Découpage par sauts explicites
  const explicitBreaks = /(?:<div\s+class=["'][^"']*page-break[^"']*["']\s*>\s*<\/div>|<!--\s*page-?break\s*-->)/gi;
  const rawSections = markdown.split(explicitBreaks);

  const rawChunks: string[] = [];

  for (const section of rawSections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // Si la section contient des séparateurs '---' ou des grands titres # qui dépassent une page
    if (trimmed.length > PAGE_TARGET_CAPACITY) {
      // Découper selon les lignes de séparateurs '---' ou titres de niveau 1 ou 2
      const blocks = trimmed.split(/(?=\n#{1,2}\s+|\n---\n)/g);
      let currentChunk = '';

      for (const block of blocks) {
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
    rawChunks.push(markdown);
  }

  // 2. Transformation en HTML assaini
  return rawChunks.map((chunk, index) => {
    try {
      const rawHtml = marked.parse(chunk) as string;
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'data-action'],
        ADD_TAGS: ['div', 'span', 'hr'],
        ADD_ATTR: ['class', 'style'],
      });

      return {
        pageIndex: index + 1,
        html: cleanHtml,
      };
    } catch {
      return {
        pageIndex: index + 1,
        html: '<p class="text-red-500">Erreur lors du rendu de la page.</p>',
      };
    }
  });
}
