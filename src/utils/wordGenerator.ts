import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  ShadingType,
  convertInchesToTwip,
  ExternalHyperlink,
} from 'docx';
import { marked } from 'marked';
import { DocumentOptions, DocumentTheme } from '../types';

/**
 * Palette de couleurs et configuration typographique par thème
 */
interface ThemeConfig {
  font: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  accentColor: string;
  codeBgColor: string;
  tableHeaderBg: string;
  tableBorderColor: string;
}

const THEME_CONFIGS: Record<DocumentTheme, ThemeConfig> = {
  modern: {
    font: 'Calibri',
    primaryColor: '1E3A8A', // Bleu marine moderne
    secondaryColor: '2563EB', // Bleu royal
    textColor: '1E293B', // Slate 800
    accentColor: '3B82F6',
    codeBgColor: 'F1F5F9',
    tableHeaderBg: '1E3A8A',
    tableBorderColor: 'CBD5E1',
  },
  academic: {
    font: 'Georgia',
    primaryColor: '1E293B', // Noir / Anthracite classique
    secondaryColor: '475569',
    textColor: '0F172A',
    accentColor: '7C3AED', // Violet profond
    codeBgColor: 'F8FAFC',
    tableHeaderBg: '334155',
    tableBorderColor: '94A3B8',
  },
  technical: {
    font: 'Segoe UI',
    primaryColor: '0F766E', // Vert pétrole / Teal
    secondaryColor: '0D9488',
    textColor: '1E293B',
    accentColor: '14B8A6',
    codeBgColor: 'F0FDFA',
    tableHeaderBg: '0F766E',
    tableBorderColor: '99F6E4',
  },
  minimal: {
    font: 'Arial',
    primaryColor: '18181B', // Zinc sombre
    secondaryColor: '3F3F46',
    textColor: '27272A',
    accentColor: '71717A',
    codeBgColor: 'F4F4F5',
    tableHeaderBg: '27272A',
    tableBorderColor: 'D4D4D8',
  },
};

/**
 * Analyse et segmente les styles en ligne (gras, italique, code, lien) d'un texte
 */
function parseInlineFormatting(text: string, theme: ThemeConfig, baseFontSizePt: number): (TextRun | ExternalHyperlink)[] {
  const elements: (TextRun | ExternalHyperlink)[] = [];
  const halfPtSize = baseFontSizePt * 2;

  // Regex pour capturer liens, gras, italique, code en ligne et texte barré
  // Format: [label](url) | **gras** | *italique* | `code` | ~~barré~~
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|\*.*?\*|`.*?`|~~.*?~~)/g;
  const parts = text.split(regex);

  for (const part of parts) {
    if (!part) continue;

    // Détection d'un lien Markdown [texte](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const linkUrl = linkMatch[2];
      try {
        elements.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: linkText,
                color: theme.accentColor,
                underline: {},
                font: theme.font,
                size: halfPtSize,
              }),
            ],
            link: linkUrl,
          })
        );
        continue;
      } catch {
        // En cas d'URL non standard, repli sur TextRun simple
      }
    }

    // Détection de texte en gras **texte**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      elements.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          color: theme.textColor,
          font: theme.font,
          size: halfPtSize,
        })
      );
      continue;
    }

    // Détection de texte en italique *texte*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      elements.push(
        new TextRun({
          text: part.slice(1, -1),
          italics: true,
          color: theme.textColor,
          font: theme.font,
          size: halfPtSize,
        })
      );
      continue;
    }

    // Détection de code en ligne `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      elements.push(
        new TextRun({
          text: ` ${part.slice(1, -1)} `,
          font: 'Consolas',
          color: 'C026D3',
          shading: {
            type: ShadingType.CLEAR,
            fill: theme.codeBgColor,
          },
          size: Math.max(16, halfPtSize - 2),
        })
      );
      continue;
    }

    // Détection de texte barré ~~texte~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      elements.push(
        new TextRun({
          text: part.slice(2, -2),
          strike: true,
          color: '94A3B8',
          font: theme.font,
          size: halfPtSize,
        })
      );
      continue;
    }

    // Texte normal standard
    elements.push(
      new TextRun({
        text: part,
        color: theme.textColor,
        font: theme.font,
        size: halfPtSize,
      })
    );
  }

  return elements;
}

/**
 * Convertit des tokens Markdown en éléments de document Word DOCX
 */
export async function generateWordDocument(
  markdown: string,
  options: DocumentOptions
): Promise<Blob> {
  const theme = THEME_CONFIGS[options.theme] || THEME_CONFIGS.modern;
  const baseFontSizePt = options.fontSize || 11;
  const lineSpacingTwip = Math.round(options.lineSpacing * 240); // 240 = simple interligne

  // Utilisation du lexer de marked pour un découpage en tokens typés
  const tokens = marked.lexer(markdown);
  const docElements: (Paragraph | Table)[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const headingLevels = [
          HeadingLevel.HEADING_1,
          HeadingLevel.HEADING_2,
          HeadingLevel.HEADING_3,
          HeadingLevel.HEADING_4,
          HeadingLevel.HEADING_5,
          HeadingLevel.HEADING_6,
        ];
        const level = headingLevels[Math.min(token.depth - 1, 5)];

        // Tailles de police adaptées en demi-points
        const headingSizes = [36, 28, 24, 22, 20, 18];
        const headingSize = headingSizes[Math.min(token.depth - 1, 5)];
        const headingColor = token.depth === 1 ? theme.primaryColor : theme.secondaryColor;

        docElements.push(
          new Paragraph({
            heading: level,
            spacing: {
              before: token.depth === 1 ? 400 : 260,
              after: 120,
            },
            children: [
              new TextRun({
                text: token.text,
                bold: true,
                color: headingColor,
                font: theme.font,
                size: headingSize,
              }),
            ],
          })
        );
        break;
      }

      case 'paragraph': {
        const runs = parseInlineFormatting(token.text, theme, baseFontSizePt);
        docElements.push(
          new Paragraph({
            spacing: {
              before: 80,
              after: 140,
              line: lineSpacingTwip,
            },
            children: runs,
          })
        );
        break;
      }

      case 'blockquote': {
        // Citation avec barre latérale gauche
        const quoteText = token.text.replace(/^>\s*/gm, '');
        const quoteRuns = parseInlineFormatting(quoteText, theme, baseFontSizePt);

        docElements.push(
          new Paragraph({
            spacing: {
              before: 160,
              after: 160,
              line: lineSpacingTwip,
            },
            indent: {
              left: convertInchesToTwip(0.4),
              right: convertInchesToTwip(0.2),
            },
            border: {
              left: {
                color: theme.primaryColor,
                space: 12,
                style: BorderStyle.SINGLE,
                size: 24,
              },
            },
            children: quoteRuns.map((r) => {
              if (r instanceof TextRun) {
                return new TextRun({
                  ...r,
                  italics: true,
                  color: '475569',
                });
              }
              return r;
            }),
          })
        );
        break;
      }

      case 'list': {
        for (let i = 0; i < token.items.length; i++) {
          const item = token.items[i];
          const isTask = item.task;
          const checked = item.checked;
          const prefix = isTask ? (checked ? '☑ ' : '☐ ') : '';

          const itemRuns = parseInlineFormatting(prefix + item.text, theme, baseFontSizePt);

          if (token.ordered) {
            docElements.push(
              new Paragraph({
                spacing: { before: 40, after: 60, line: lineSpacingTwip },
                indent: { left: convertInchesToTwip(0.35) },
                children: [
                  new TextRun({
                    text: `${i + 1}.  `,
                    bold: true,
                    color: theme.primaryColor,
                    font: theme.font,
                    size: baseFontSizePt * 2,
                  }),
                  ...itemRuns,
                ],
              })
            );
          } else {
            docElements.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 40, after: 60, line: lineSpacingTwip },
                children: itemRuns,
              })
            );
          }
        }
        break;
      }

      case 'code': {
        // Bloc de code avec cadre et police mono
        const codeLines = token.text.split('\n');
        for (const line of codeLines) {
          docElements.push(
            new Paragraph({
              spacing: { before: 20, after: 20 },
              indent: { left: convertInchesToTwip(0.3) },
              shading: {
                type: ShadingType.CLEAR,
                fill: theme.codeBgColor,
              },
              children: [
                new TextRun({
                  text: line || ' ',
                  font: 'Consolas',
                  size: 18, // 9pt
                  color: '1E293B',
                }),
              ],
            })
          );
        }
        // Petit espacement après le bloc
        docElements.push(
          new Paragraph({
            spacing: { before: 40, after: 80 },
            children: [],
          })
        );
        break;
      }

      case 'table': {
        // Construction d'une table Word formatée
        const tableRows: TableRow[] = [];

        // Ligne d'en-tête
        const headerCells: TableCell[] = token.header.map((col) => {
          return new TableCell({
            shading: {
              type: ShadingType.CLEAR,
              fill: theme.tableHeaderBg,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({
                    text: col.text,
                    bold: true,
                    color: 'FFFFFF',
                    font: theme.font,
                    size: baseFontSizePt * 2,
                  }),
                ],
              }),
            ],
          });
        });

        tableRows.push(new TableRow({ children: headerCells, tableHeader: true }));

        // Lignes de données
        token.rows.forEach((row, rowIndex) => {
          const isAlt = rowIndex % 2 === 1;
          const cells: TableCell[] = row.map((cell) => {
            const cellRuns = parseInlineFormatting(cell.text, theme, baseFontSizePt);
            return new TableCell({
              shading: {
                type: ShadingType.CLEAR,
                fill: isAlt ? 'F8FAFC' : 'FFFFFF',
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 80, after: 80 },
                  children: cellRuns,
                }),
              ],
            });
          });
          tableRows.push(new TableRow({ children: cells }));
        });

        docElements.push(
          new Table({
            rows: tableRows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: theme.tableBorderColor },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: theme.primaryColor },
              left: { style: BorderStyle.SINGLE, size: 6, color: theme.tableBorderColor },
              right: { style: BorderStyle.SINGLE, size: 6, color: theme.tableBorderColor },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: theme.tableBorderColor },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: theme.tableBorderColor },
            },
          })
        );

        // Espacement après le tableau
        docElements.push(
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [],
          })
        );
        break;
      }

      case 'hr': {
        // Séparateur horizontal
        docElements.push(
          new Paragraph({
            spacing: { before: 180, after: 180 },
            border: {
              bottom: {
                color: 'CBD5E1',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            children: [],
          })
        );
        break;
      }

      case 'html': {
        // Détecter un saut de page manuel <div class="page-break"></div> ou <!-- pagebreak -->
        const raw = (token as { text?: string }).text || '';
        if (
          raw.includes('page-break') ||
          raw.includes('pagebreak') ||
          raw.includes('break-before')
        ) {
          docElements.push(
            new Paragraph({
              children: [new PageBreak()],
            })
          );
        }
        break;
      }

      default:
        // Gestion des autres cas éventuels
        if ('text' in token && typeof (token as { text?: string }).text === 'string') {
          const runs = parseInlineFormatting((token as { text: string }).text, theme, baseFontSizePt);
          docElements.push(
            new Paragraph({
              spacing: { before: 60, after: 120, line: lineSpacingTwip },
              children: runs,
            })
          );
        }
        break;
    }
  }

  // Création de l'en-tête optionnel avec le titre du document
  const headerContent = options.title
    ? new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: options.title,
                font: theme.font,
                size: 18,
                color: '94A3B8',
              }),
            ],
          }),
        ],
      })
    : undefined;

  // Création du pied de page avec numérotation de page ("Page X sur Y")
  const footerContent = options.includePageNumbers
    ? new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Page ',
                font: theme.font,
                size: 18,
                color: '64748B',
              }),
              new TextRun({
                children: [PageNumber.CURRENT],
                font: theme.font,
                size: 18,
                color: '64748B',
              }),
              new TextRun({
                text: ' sur ',
                font: theme.font,
                size: 18,
                color: '64748B',
              }),
              new TextRun({
                children: [PageNumber.TOTAL_PAGES],
                font: theme.font,
                size: 18,
                color: '64748B',
              }),
            ],
          }),
        ],
      })
    : undefined;

  // Création du document final
  const doc = new Document({
    creator: options.author || 'Convertisseur Markdown vers Word',
    title: options.title,
    description: 'Document généré depuis Markdown',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: headerContent ? { default: headerContent } : undefined,
        footers: footerContent ? { default: footerContent } : undefined,
        children: docElements.length > 0 ? docElements : [new Paragraph({ text: 'Document vide' })],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Déclenche le téléchargement du document Word côté client
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const cleanFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = cleanFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
