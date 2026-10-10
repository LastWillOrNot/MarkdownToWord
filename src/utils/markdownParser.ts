import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { DocumentStats } from '../types';
import {
  extractMermaidBlocks,
  renderAllMermaidBlocks,
  injectMermaidHtml,
} from './mermaidRenderer';

/**
 * Configure les options de parsing Markdown
 */
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Nettoie et transforme le code Markdown en HTML sécurisé.
 * Intègre le support des diagrammes Mermaid avec assainissement rigoureux anti-XSS.
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

    // Configuration stricte de DOMPurify pour la sécurité
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'data-action'],
      ADD_TAGS: ['div', 'span', 'hr'],
      ADD_ATTR: ['class', 'style', 'data-mermaid-id'],
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

  // Nettoyage sommaire des balises et caractères spéciaux Markdown pour le comptage de mots
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, '') // retirer les blocs de code
    .replace(/#+\s+/g, '') // retirer les #
    .replace(/(\*\*|__|\*|_|~~)/g, '') // retirer le formattage
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // liens
    .replace(/[>|-]/g, ' ')
    .trim();

  const words = plainText.split(/\s+/).filter(Boolean).length;
  const characters = markdown.length;
  // Vitesse de lecture moyenne : 200 mots par minute
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  // Compter les titres (#)
  const headingsMatches = markdown.match(/^#{1,6}\s+.+$/gm);
  const headingsCount = headingsMatches ? headingsMatches.length : 0;

  // Compter les tableaux (lignes contenant des barres verticales |)
  const tableMatches = markdown.match(/^\|.+\|$/gm);
  const tablesCount = tableMatches ? Math.max(1, Math.floor(tableMatches.length / 3)) : 0;

  return {
    words,
    characters,
    readingTimeMinutes,
    headingsCount,
    tablesCount,
  };
}

/**
 * Extrait le premier titre de niveau 1 (# Mon Titre) comme titre par défaut du document
 */
export function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (match && match[1]) {
    return match[1].replace(/[*_~`]/g, '').trim();
  }
  return 'Document';
}
