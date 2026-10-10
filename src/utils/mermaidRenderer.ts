import mermaid from 'mermaid';

// Initialisation unique et sécurisée de Mermaid
let isInitialized = false;

export function initMermaid(): void {
  if (isInitialized || typeof window === 'undefined') return;
  try {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'default',
      themeVariables: {
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        primaryColor: '#e0f2fe',
        primaryTextColor: '#0f172a',
        primaryBorderColor: '#38bdf8',
        lineColor: '#475569',
        secondaryColor: '#f1f5f9',
        tertiaryColor: '#f8fafc',
      },
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      suppressErrorRendering: true,
    });
    isInitialized = true;
  } catch (err) {
    console.error('Erreur initialisation Mermaid:', err);
  }
}

/**
 * Mots-clés caractéristiques indiquant la présence d'un diagramme Mermaid
 */
const MERMAID_KEYWORDS = [
  'graph',
  'flowchart',
  'statediagram',
  'statediagram-v2',
  'sequencediagram',
  'classdiagram',
  'classdiagram-v2',
  'erdiagram',
  'gantt',
  'pie',
  'gitgraph',
  'journey',
  'mindmap',
  'timeline',
  'quadrantchart',
  'sankey-beta',
  'xychart-beta',
  'block-beta',
  'architecture',
  'packet-beta',
];

/**
 * Détecte si un bloc de code correspond à un diagramme Mermaid
 */
export function isMermaidCode(code: string, lang?: string): boolean {
  if (lang && lang.trim().toLowerCase() === 'mermaid') {
    return true;
  }

  const trimmed = (code || '').trim().toLowerCase();
  if (!trimmed) return false;

  const firstLine = trimmed.split('\n')[0].trim();
  return MERMAID_KEYWORDS.some((kw) => firstLine.startsWith(kw));
}

/**
 * Cache mémoire pour éviter de re-rendre les mêmes diagrammes lors des frappes au clavier
 */
const svgCache = new Map<string, string>();

/**
 * Rend un diagramme Mermaid sous forme de chaîne SVG
 */
export async function renderMermaidSvg(code: string): Promise<{ svg: string; error?: string }> {
  initMermaid();
  const trimmedCode = code.trim();

  if (!trimmedCode) {
    return { svg: '', error: 'Code Mermaid vide' };
  }

  // Vérifier dans le cache
  if (svgCache.has(trimmedCode)) {
    return { svg: svgCache.get(trimmedCode)! };
  }

  const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;

  try {
    const { svg } = await mermaid.render(uniqueId, trimmedCode);

    // Amélioration de la réactivité du SVG : assurer le viewBox et la largeur 100%
    const responsiveSvg = svg.replace(/<svg\s+([^>]+)>/, (_match, attrs) => {
      let cleanAttrs = attrs;
      if (!cleanAttrs.includes('style=')) {
        cleanAttrs += ' style="max-width: 100%; height: auto;"';
      }
      return `<svg ${cleanAttrs}>`;
    });

    svgCache.set(trimmedCode, responsiveSvg);
    return { svg: responsiveSvg };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // Nettoyer les éléments résiduels créés par Mermaid en cas d'erreur
    if (typeof document !== 'undefined') {
      const el = document.getElementById(uniqueId);
      if (el) el.remove();
      const errEl = document.getElementById(`d${uniqueId}`);
      if (errEl) errEl.remove();
    }
    return { svg: '', error: msg };
  }
}

/**
 * Convertit un diagramme Mermaid en image PNG (Uint8Array) pour l'intégration dans Word (.docx)
 */
export async function renderMermaidToPng(
  code: string
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  try {
    const { svg, error } = await renderMermaidSvg(code);
    if (error || !svg) return null;

    // Analyse des dimensions du SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
    const svgEl = svgDoc.documentElement;

    let naturalWidth = parseFloat(svgEl.getAttribute('width') || '');
    let naturalHeight = parseFloat(svgEl.getAttribute('height') || '');

    if ((!naturalWidth || !naturalHeight || isNaN(naturalWidth) || isNaN(naturalHeight)) && svgEl.hasAttribute('viewBox')) {
      const vb = svgEl.getAttribute('viewBox')?.split(/\s+|,/) || [];
      if (vb.length === 4) {
        naturalWidth = parseFloat(vb[2]);
        naturalHeight = parseFloat(vb[3]);
      }
    }

    if (!naturalWidth || isNaN(naturalWidth)) naturalWidth = 600;
    if (!naturalHeight || isNaN(naturalHeight)) naturalHeight = 400;

    // Normaliser la taille pour une page Word standard (largeur max environ 520px)
    const MAX_WORD_WIDTH = 520;
    let targetWidth = naturalWidth;
    let targetHeight = naturalHeight;

    if (naturalWidth > MAX_WORD_WIDTH) {
      const ratio = MAX_WORD_WIDTH / naturalWidth;
      targetWidth = MAX_WORD_WIDTH;
      targetHeight = Math.round(naturalHeight * ratio);
    }

    // Assurer des attributs width et height explicites sur le SVG
    svgEl.setAttribute('width', `${naturalWidth}`);
    svgEl.setAttribute('height', `${naturalHeight}`);
    const serializedSvg = new XMLSerializer().serializeToString(svgEl);

    // Créer un blob et charger l'image
    const svgBlob = new Blob([serializedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);

    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = blobUrl;
    });

    URL.revokeObjectURL(blobUrl);

    // Dessiner sur un canvas avec facteur d'échelle haute définition (2x) pour une netteté d'impression
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth * scale;
    canvas.height = targetHeight * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fond blanc net pour Word
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Conversion en ArrayBuffer PNG
    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });

    if (!pngBlob) return null;

    const arrayBuffer = await pngBlob.arrayBuffer();
    return {
      data: new Uint8Array(arrayBuffer),
      width: targetWidth,
      height: targetHeight,
    };
  } catch (err) {
    console.error('Erreur lors de la conversion Mermaid en PNG:', err);
    return null;
  }
}

/**
 * Génère le composant HTML sécurisé pour afficher le diagramme dans la page Word
 */
export function buildMermaidHtml(code: string, svg: string): string {
  const safeCode = encodeURIComponent(code);
  return `
    <div class="mermaid-diagram-card not-prose my-6 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs text-center flex flex-col items-center justify-center transition hover:border-slate-300" data-mermaid-code="${safeCode}">
      <div class="mermaid-svg-wrapper w-full flex justify-center items-center overflow-x-auto py-2">
        ${svg}
      </div>
      <div class="mt-2 text-[11px] font-medium text-slate-400 select-none flex items-center gap-1.5 print:hidden">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        <span>Diagramme Mermaid interactif</span>
      </div>
    </div>
  `;
}

/**
 * Génère le composant HTML de notification d'erreur Mermaid
 */
export function buildMermaidErrorHtml(code: string, errorMessage: string): string {
  const safeCode = encodeURIComponent(code);
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  return `
    <div class="mermaid-diagram-error not-prose my-6 rounded-xl border border-amber-300/80 bg-amber-50/70 p-4 text-left shadow-2xs" data-mermaid-code="${safeCode}">
      <div class="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1.5">
        <span class="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        <span>Diagramme Mermaid — En cours d'édition</span>
      </div>
      <p class="text-[11px] text-amber-800 font-medium mb-2">${escapeHtml(errorMessage)}</p>
      <pre class="text-xs font-mono bg-white p-2.5 rounded-lg border border-amber-200/80 text-slate-800 overflow-x-auto"><code>${escapeHtml(code)}</code></pre>
    </div>
  `;
}

export interface MermaidBlock {
  id: string;
  code: string;
}

/**
 * Extrait les blocs Mermaid d'un texte Markdown et les remplace par des balises d'emplacement temporaires
 */
export function extractMermaidBlocks(markdown: string): {
  templateMarkdown: string;
  blocks: MermaidBlock[];
} {
  const blocks: MermaidBlock[] = [];
  // Regex pour capturer les blocs de code Markdown ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)[ \t]*\n([\s\S]*?)```/g;

  let counter = 0;
  const templateMarkdown = markdown.replace(codeBlockRegex, (match, lang, code) => {
    if (isMermaidCode(code, lang)) {
      const id = `mmd-ph-${counter++}`;
      blocks.push({ id, code: code.trim() });
      return `\n\n<div class="mermaid-block-placeholder" data-mermaid-id="${id}"></div>\n\n`;
    }
    return match;
  });

  return { templateMarkdown, blocks };
}

/**
 * Rendu asynchrone de l'ensemble des blocs Mermaid découverts
 */
export async function renderAllMermaidBlocks(
  blocks: MermaidBlock[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    blocks.map(async ({ id, code }) => {
      const res = await renderMermaidSvg(code);
      if (res.svg) {
        map.set(id, buildMermaidHtml(code, res.svg));
      } else {
        map.set(id, buildMermaidErrorHtml(code, res.error || 'Erreur de syntaxe Mermaid'));
      }
    })
  );
  return map;
}

/**
 * Remplace les balises d'emplacement par le HTML final du diagramme
 */
export function injectMermaidHtml(html: string, mermaidMap: Map<string, string>): string {
  return html.replace(
    /<div class="mermaid-block-placeholder" data-mermaid-id="([^"]+)"><\/div>/g,
    (_match, id) => {
      return mermaidMap.get(id) || '';
    }
  );
}

