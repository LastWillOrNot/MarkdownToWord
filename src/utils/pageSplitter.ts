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

// Hauteur de contenu utile estimée en pixels pour une page A4 Word standard (hors en-tête et pied de page)
const PAGE_CONTENT_MAX_HEIGHT = 780;

/**
 * Calcule la hauteur estimée en pixels d'un bloc Markdown sur une page A4 Word
 */
function estimateBlockHeight(block: string): number {
  const trimmed = block.trim();
  if (!trimmed) return 0;

  // 1. Détection des diagrammes Mermaid (placeholder ou bloc de code)
  if (
    trimmed.includes('mermaid-block-placeholder') ||
    trimmed.startsWith('```mermaid')
  ) {
    // Un diagramme Mermaid moyen fait entre 240px et 320px avec sa marge et son cadre
    return 290;
  }

  // 2. Détection des blocs de code standards
  if (trimmed.startsWith('```')) {
    const lines = trimmed.split('\n').length;
    return Math.max(70, lines * 21 + 35);
  }

  // 3. Détection des titres
  if (/^#\s+/.test(trimmed)) {
    return 85; // H1 avec marge haute, marge basse et bordure
  }
  if (/^##\s+/.test(trimmed)) {
    return 65; // H2 avec marge
  }
  if (/^###\s+/.test(trimmed)) {
    return 50; // H3
  }
  if (/^#{4,6}\s+/.test(trimmed)) {
    return 40;
  }

  // 4. Détection des tableaux Markdown (| col1 | col2 |)
  if (trimmed.startsWith('|') || trimmed.includes('\n|')) {
    const rows = trimmed.split('\n').filter((line) => line.trim().startsWith('|'));
    const rowsCount = rows.length;
    // En-tête ~45px, chaque ligne ~36px, marges ~25px
    return Math.max(80, 45 + Math.max(0, rowsCount - 1) * 36 + 25);
  }

  // 5. Détection des citations (> citation)
  if (trimmed.startsWith('>')) {
    const lines = Math.ceil(trimmed.length / 65);
    return lines * 24 + 30;
  }

  // 6. Détection des listes à puces ou numérotées
  if (/^([*+-]|\d+\.)\s+/m.test(trimmed)) {
    const items = trimmed.split('\n').filter((l) => /^([*+-]|\d+\.)\s+/.test(l.trim()));
    return Math.max(40, items.length * 28 + 20);
  }

  // 7. Séparateur horizontal
  if (/^([-*_]){3,}$/.test(trimmed)) {
    return 45;
  }

  // 8. Paragraphe de texte standard
  // Largeur d'une page A4 Word avec marges standard = environ 75 à 80 caractères par ligne
  const lines = Math.ceil(trimmed.length / 75);
  return Math.max(35, lines * 23 + 18);
}

/**
 * Découpe une section de Markdown en blocs élémentaires (titres, paragraphes, tables, diagrammes...)
 */
function splitIntoBlocks(section: string): string[] {
  const blocks: string[] = [];
  const lines = section.split('\n');
  let currentBlockLines: string[] = [];
  let inCodeBlock = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Début / Fin de bloc de code
    if (trimmedLine.startsWith('```')) {
      if (!inCodeBlock) {
        // Vider le bloc précédent
        if (currentBlockLines.length > 0) {
          blocks.push(currentBlockLines.join('\n').trim());
          currentBlockLines = [];
        }
        inCodeBlock = true;
        currentBlockLines.push(line);
      } else {
        inCodeBlock = false;
        currentBlockLines.push(line);
        blocks.push(currentBlockLines.join('\n').trim());
        currentBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      currentBlockLines.push(line);
      continue;
    }

    // Détection des placeholders Mermaid
    if (line.includes('mermaid-block-placeholder')) {
      if (currentBlockLines.length > 0) {
        blocks.push(currentBlockLines.join('\n').trim());
        currentBlockLines = [];
      }
      blocks.push(line.trim());
      continue;
    }

    // Détection de tableau
    if (trimmedLine.startsWith('|')) {
      if (!inTable) {
        if (currentBlockLines.length > 0) {
          blocks.push(currentBlockLines.join('\n').trim());
          currentBlockLines = [];
        }
        inTable = true;
      }
      currentBlockLines.push(line);
      continue;
    } else if (inTable) {
      inTable = false;
      blocks.push(currentBlockLines.join('\n').trim());
      currentBlockLines = [];
    }

    // Ligne vide : frontière naturelle entre blocs
    if (trimmedLine === '') {
      if (currentBlockLines.length > 0) {
        blocks.push(currentBlockLines.join('\n').trim());
        currentBlockLines = [];
      }
      continue;
    }

    // Titres Markdown (# Titre) : nouveau bloc immédiat
    if (/^#{1,6}\s+/.test(trimmedLine)) {
      if (currentBlockLines.length > 0) {
        blocks.push(currentBlockLines.join('\n').trim());
        currentBlockLines = [];
      }
      currentBlockLines.push(line);
      blocks.push(currentBlockLines.join('\n').trim());
      currentBlockLines = [];
      continue;
    }

    // Séparateur horizontal (---)
    if (/^([-*_]){3,}$/.test(trimmedLine)) {
      if (currentBlockLines.length > 0) {
        blocks.push(currentBlockLines.join('\n').trim());
        currentBlockLines = [];
      }
      blocks.push(line.trim());
      continue;
    }

    currentBlockLines.push(line);
  }

  if (currentBlockLines.length > 0) {
    const remaining = currentBlockLines.join('\n').trim();
    if (remaining) blocks.push(remaining);
  }

  return blocks.filter((b) => b.length > 0);
}

/**
 * Découpe un très long paragraphe en sous-paragraphes au niveau des phrases pour ne pas déborder d'une page
 */
function splitLongParagraph(paragraph: string, maxHeight: number): string[] {
  const estimatedHeight = estimateBlockHeight(paragraph);
  if (estimatedHeight <= maxHeight) {
    return [paragraph];
  }

  // Découpage au niveau des phrases complètes
  const sentences = paragraph.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    if (estimateBlockHeight(candidate) > maxHeight && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = candidate;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [paragraph];
}

/**
 * Découpe un document Markdown en une succession de pages A4 Word fidèles.
 * Fonctionnement :
 * - Détecte d'abord les sauts explicites (<div class="page-break"></div> ou <!-- pagebreak -->)
 * - Calcule l'encombrement vertical réaliste (en pixels) de chaque bloc (titres, paragraphes, tables, diagrammes Mermaid)
 * - Répartit le contenu sur plusieurs pages dès qu'il dépasse la hauteur d'une feuille A4
 * - Protège contre les titres orphelins en fin de page
 * - Assainit chaque fragment avec DOMPurify
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
  const { templateMarkdown, blocks: mermaidBlocks } = extractMermaidBlocks(markdown);

  // 2. Découpage par sauts explicites
  const explicitBreaks = /(?:<div\s+class=["'][^"']*page-break[^"']*["']\s*>\s*<\/div>|<!--\s*page-?break\s*-->)/gi;
  const rawSections = templateMarkdown.split(explicitBreaks);

  const pageChunks: string[] = [];

  for (const section of rawSections) {
    const trimmedSection = section.trim();
    if (!trimmedSection) continue;

    // Découper la section en blocs atomiques (titres, listes, tables, diagrammes, paragraphes)
    const blocks = splitIntoBlocks(trimmedSection);
    let currentPageBlocks: string[] = [];
    let currentPageHeight = 0;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockHeight = estimateBlockHeight(block);

      // Traitement des séparateurs '---' : si la page est déjà bien remplie (> 350px), ils font office de saut de page
      if (/^([-*_]){3,}$/.test(block) && currentPageHeight > 350) {
        if (currentPageBlocks.length > 0) {
          pageChunks.push(currentPageBlocks.join('\n\n'));
          currentPageBlocks = [];
          currentPageHeight = 0;
        }
        continue;
      }

      // Si le bloc seul dépasse la capacité totale d'une page (ex: très long paragraphe de texte)
      if (blockHeight > PAGE_CONTENT_MAX_HEIGHT) {
        // Si la page courante a déjà du contenu, la fermer d'abord
        if (currentPageBlocks.length > 0) {
          pageChunks.push(currentPageBlocks.join('\n\n'));
          currentPageBlocks = [];
          currentPageHeight = 0;
        }

        // Si c'est un paragraphe ou texte, le fractionner proprement entre phrases
        if (!block.startsWith('```') && !block.startsWith('|')) {
          const subChunks = splitLongParagraph(block, PAGE_CONTENT_MAX_HEIGHT);
          for (let s = 0; s < subChunks.length; s++) {
            if (s === subChunks.length - 1) {
              currentPageBlocks.push(subChunks[s]);
              currentPageHeight = estimateBlockHeight(subChunks[s]);
            } else {
              pageChunks.push(subChunks[s]);
            }
          }
          continue;
        }
      }

      // Protection contre les titres orphelins (Widow/Orphan) :
      // Si c'est un titre et qu'il ne reste pas assez de place pour le titre ET le bloc suivant
      const isHeading = /^#{1,6}\s+/.test(block);
      if (isHeading && currentPageHeight > PAGE_CONTENT_MAX_HEIGHT - 120 && currentPageBlocks.length > 0) {
        pageChunks.push(currentPageBlocks.join('\n\n'));
        currentPageBlocks = [block];
        currentPageHeight = blockHeight;
        continue;
      }

      // Vérifier si l'ajout de ce bloc ferait déborder la page A4
      if (currentPageHeight + blockHeight > PAGE_CONTENT_MAX_HEIGHT && currentPageBlocks.length > 0) {
        // Fermer la page courante et démarrer une nouvelle page
        pageChunks.push(currentPageBlocks.join('\n\n'));
        currentPageBlocks = [block];
        currentPageHeight = blockHeight;
      } else {
        currentPageBlocks.push(block);
        currentPageHeight += blockHeight;
      }
    }

    if (currentPageBlocks.length > 0) {
      pageChunks.push(currentPageBlocks.join('\n\n'));
    }
  }

  if (pageChunks.length === 0) {
    pageChunks.push(templateMarkdown);
  }

  // 3. Transformation en HTML assaini avec réinjection Mermaid
  return pageChunks.map((chunk, index) => {
    try {
      const rawHtml = marked.parse(chunk) as string;
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        USE_PROFILES: { html: true, svg: true },
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
        ADD_TAGS: ['div', 'span', 'hr', 'pre', 'code'],
        ADD_ATTR: ['class', 'style', 'data-mermaid-id', 'data-mermaid-code', 'data-code-block'],
      });

      let finalHtml = cleanHtml;
      if (mermaidMap && mermaidMap.size > 0) {
        finalHtml = injectMermaidHtml(cleanHtml, mermaidMap);
      } else if (mermaidBlocks.length > 0) {
        finalHtml = cleanHtml.replace(
          /<div class="mermaid-block-placeholder" data-mermaid-id="([^"]+)"><\/div>/g,
          (_match, id) => {
            const blk = mermaidBlocks.find((b) => b.id === id);
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
