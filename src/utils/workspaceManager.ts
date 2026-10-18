import JSZip from 'jszip';
import { ProjectItem, DocumentOptions } from '../types';
import { generateWordDocument } from './wordGenerator';
import { convertDocxToMarkdown } from './docxToMarkdown';

/**
 * Projet par défaut complet démontrant le travail sur plusieurs répertoires
 */
export const DEFAULT_PROJECT_TREE: ProjectItem[] = [
  {
    id: 'f-root-intro',
    name: '00_Index_et_Introduction.md',
    path: '00_Index_et_Introduction.md',
    type: 'file',
    content: `# Projet de Référentiel Documentaire 2026

**Organisation :** Direction des Systèmes d'Information & Projets  
**Version :** 4.2.0-Production  
**Statut :** Validé par le Comité Technique  

---

## 1. Présentation Générale de l'Espace de Travail

Cet environnement permet désormais de **travailler directement sur des répertoires entiers** contenant de multiples dossiers et fichiers Markdown ou Microsoft Word (.docx).

### Organisation du Répertoire :
- **📁 01_Specifications** : Spécifications fonctionnelles, matrice des exigences et diagramme de cycle de vie Mermaid
- **📁 02_Architecture_et_Code** : Guides d'implémentation multi-langages avec **coloration syntaxique** (Java, TypeScript, Python, SQL, Bash)
- **📁 03_Comptes_Rendus** : Procès-verbaux et relevés de décisions

> *« La gestion par répertoire permet d'éditer, de naviguer et d'exporter l'ensemble d'une documentation volumineuse en un clic au format Microsoft Word. »*

---

## 2. Table des Matières du Répertoire

| Répertoire | Document | Type de Contenu | Format Cible |
| :--- | :--- | :--- | :--- |
| **Racine** | 00_Index_et_Introduction.md | Vue d'ensemble & Index | Word (.docx) |
| **01_Specifications** | 01_Cahier_des_Charges.md | Exigences & Règles métiers | Word (.docx) |
| **01_Specifications** | 02_Cycle_de_Vie_Mermaid.md | Diagrammes Mermaid interactifs | Word (.docx) |
| **02_Architecture** | 01_Services_et_API.md | Code source avec coloration | Word (.docx) |
| **03_Comptes_Rendus** | CR_Comite_Pilotage_2026.md | Relevé de décisions & Matrice | Word (.docx) |
`,
  },
  {
    id: 'dir-specs',
    name: '01_Specifications',
    path: '01_Specifications',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'f-spec-cdc',
        name: '01_Cahier_des_Charges.md',
        path: '01_Specifications/01_Cahier_des_Charges.md',
        type: 'file',
        content: `# Cahier des Charges Fonctionnel

**Pôle :** Direction de l'Ingénierie Logicielle  
**Date :** 17 Octobre 2026  

---

## 1. Périmètre et Exigences Fonctionnelles

Le tableau ci-dessous répertorie les exigences prioritaires de la plateforme :

| Réf. Exigence | Intitulé | Priorité | Critère d'Acceptation |
| :--- | :--- | :--- | :--- |
| **REQ-DIR-01** | Support complet des répertoires | Critique | Arborescence de dossiers & fichiers modifiable |
| **REQ-DIR-02** | Importation de dossiers locaux | Élevée | Sélecteur de dossier natif ou HTML5 webkitdirectory |
| **REQ-DIR-03** | Coloration syntaxique du code | Élevée | Mise en valeur automatique multi-langages |
| **REQ-DIR-04** | Exportation groupée en archive ZIP | Majeure | Téléchargement de tous les documents .docx d'un clic |
| **REQ-MMD-05** | Moteur de diagrammes Mermaid | Élevée | Rendu vectoriel SVG et image haute résolution Word |

---

## 2. Règles de Gestion

1. **RG-SEC-01** : Toutes les données restent strictement locales dans le navigateur, garantissant la confidentialité industrielle.
2. **RG-DOC-02** : Chaque tableau Markdown généré dans Word doit comporter des bordures de cellules visibles et harmonisées.
`,
      },
      {
        id: 'f-spec-mermaid',
        name: '02_Cycle_de_Vie_Mermaid.md',
        path: '01_Specifications/02_Cycle_de_Vie_Mermaid.md',
        type: 'file',
        content: `# 7. Spécification & Cycle de Vie

**Module :** Gestion du Référentiel Documentaire  
**Auteur :** Architecte Solution  

---

## 7.7 Cycle de vie

Le diagramme d'états ci-dessous formalise les différentes transitions applicatives prises en charge :

\`\`\`mermaid
stateDiagram-v2
    [*] --> draft: création
    draft --> published: Publier (commit Git bloquant)
    published --> draft: changement de statut
    draft --> archived
    published --> archived
    draft --> supprimée: Supprimer (logique)
    published --> supprimée
\`\`\`

- **RG-RUL-13** — **Publier** crée un commit Git bloquant
- **RG-RUL-14** — L'archivage est réversible vers le statut brouillon
- **RG-RUL-15** — La suppression logique conserve l'historique complet

---

## 7.8 Architecture des Flux

\`\`\`mermaid
flowchart LR
    DIR[Répertoire de fichiers] --> TREE[Explorateur Arborescent]
    TREE --> EDITOR[Éditeur & Coloration]
    EDITOR --> PARSER[Parseur Sécurisé]
    PARSER --> MMD[Convertisseur Mermaid]
    MMD --> PREVIEW[Aperçu A4 Word]
    PREVIEW --> DOCX[Téléchargement Word .docx]
\`\`\`
`,
      },
    ],
  },
  {
    id: 'dir-code',
    name: '02_Architecture_et_Code',
    path: '02_Architecture_et_Code',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'f-code-services',
        name: '01_Services_et_API.md',
        path: '02_Architecture_et_Code/01_Services_et_API.md',
        type: 'file',
        content: `# Guides d'Implémentation & Exemples de Code

Ce document illustre la **coloration syntaxique automatique** prise en charge sur les principaux langages de programmation.

---

## 1. Service Métier (Java Spring Boot)

\`\`\`java
package com.entreprise.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
@Transactional
public class DocumentService {

    private final DocumentRepository repository;

    public DocumentService(DocumentRepository repository) {
        this.repository = repository;
    }

    public DocumentResponse processDocument(Long documentId) {
        return repository.findById(documentId)
            .filter(doc -> "PUBLISHED".equals(doc.getStatus()))
            .map(this::mapToResponse)
            .orElseThrow(() -> new DocumentNotFoundException("Document introuvable: " + documentId));
    }
}
\`\`\`

---

## 2. API de Traitement Asynchrone (TypeScript)

\`\`\`typescript
export interface FileNode {
  id: string;
  name: string;
  path: string;
  size: number;
}

export async function processDirectoryFiles(files: FileNode[]): Promise<Map<string, string>> {
  const resultMap = new Map<string, string>();
  for (const file of files) {
    console.log(\`Traitement du fichier \${file.name}...\`);
    const content = await fetchFileContent(file.path);
    resultMap.set(file.id, content);
  }
  return resultMap;
}
\`\`\`

---

## 3. Requête d'Extraction Analytique (SQL)

\`\`\`sql
SELECT 
    d.department_name,
    COUNT(doc.id) AS total_documents,
    AVG(doc.page_count) AS avg_pages,
    MAX(doc.updated_at) AS last_modified
FROM departments d
LEFT JOIN documents doc ON doc.department_id = d.id
WHERE doc.status = 'ACTIVE' AND doc.deleted_at IS NULL
GROUP BY d.department_name
HAVING COUNT(doc.id) > 0
ORDER BY total_documents DESC;
\`\`\`

---

## 4. Script de Déploiement Automatisé (Bash)

\`\`\`bash
#!/usr/bin/env bash
set -euo pipefail

echo "==> Démarrage de la compilation du projet..."
npm install --frozen-lockfile
npm run lint
npm run build

echo "==> Déploiement du conteneur de production..."
docker build -t convertisseur-word:latest .
docker run -d -p 3000:3000 --restart always convertisseur-word:latest
echo "==> Application accessible avec succès sur le port 3000 !"
\`\`\`
`,
      },
    ],
  },
  {
    id: 'dir-cr',
    name: '03_Comptes_Rendus',
    path: '03_Comptes_Rendus',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'f-cr-copil',
        name: 'CR_Comite_Pilotage_2026.md',
        path: '03_Comptes_Rendus/CR_Comite_Pilotage_2026.md',
        type: 'file',
        content: `# Compte-Rendu : Comité de Pilotage Numérique

**Date de la séance :** 17 Octobre 2026  
**Lieu :** Salle de Conférence / Teams  

---

## 1. Décisions Prises

1. **Adoption de la gestion par répertoires** : Permet aux chefs de projets de centraliser des corpus documentaires complets.
2. **Export ZIP multi-documents** : Les utilisateurs peuvent désormais télécharger en une seule fois l'intégralité de leurs documents Word (.docx) tout en conservant la structure des sous-dossiers.
3. **Conformité des tableaux et coloration** : Les tableaux et blocs de code sont certifiés lisibles et conformes aux normes d'accessibilité.

---

## 2. Plan d'Action

| Action | Responsable | Échéance | Statut |
| :--- | :--- | :--- | :--- |
| Valider l'import de dossiers réels | Équipe DSI | 24/10/2026 | Terminé |
| Tester les blocs de code Java et TypeScript | Pôle Dev | 22/10/2026 | Terminé |
| Diffuser le guide d'utilisation aux équipes | Méthodes | 30/10/2026 | À faire |
`,
      },
    ],
  },
];

/**
 * Récupère la liste plate de tous les fichiers d'une arborescence
 */
export function getAllFiles(items: ProjectItem[]): ProjectItem[] {
  const result: ProjectItem[] = [];

  function traverse(nodes: ProjectItem[]) {
    for (const node of nodes) {
      if (node.type === 'file') {
        result.push(node);
      } else if (node.type === 'folder' && node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(items);
  return result;
}

/**
 * Recherche un élément par son identifiant unique
 */
export function findItemById(items: ProjectItem[], id: string): ProjectItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.type === 'folder' && item.children) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Met à jour le contenu d'un fichier dans l'arborescence (immutabilité)
 */
export function updateFileContentInTree(
  items: ProjectItem[],
  fileId: string,
  newContent: string
): ProjectItem[] {
  return items.map((item) => {
    if (item.id === fileId && item.type === 'file') {
      return {
        ...item,
        content: newContent,
        isModified: true,
      };
    }
    if (item.type === 'folder' && item.children) {
      return {
        ...item,
        children: updateFileContentInTree(item.children, fileId, newContent),
      };
    }
    return item;
  });
}

/**
 * Alterne l'état ouvert/fermé d'un dossier
 */
export function toggleFolderInTree(items: ProjectItem[], folderId: string): ProjectItem[] {
  return items.map((item) => {
    if (item.id === folderId && item.type === 'folder') {
      return {
        ...item,
        isOpen: !item.isOpen,
      };
    }
    if (item.type === 'folder' && item.children) {
      return {
        ...item,
        children: toggleFolderInTree(item.children, folderId),
      };
    }
    return item;
  });
}

/**
 * Crée un nouveau fichier dans un dossier cible (ou à la racine)
 */
export function createFileInTree(
  items: ProjectItem[],
  parentFolderId: string | null,
  fileName: string,
  initialContent = '# Nouveau Document\n\nCommencez à rédiger votre contenu ici...\n'
): { newTree: ProjectItem[]; createdFile: ProjectItem } {
  const cleanName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
  const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  let createdFile: ProjectItem = {
    id: fileId,
    name: cleanName,
    path: cleanName,
    type: 'file',
    content: initialContent,
    isModified: false,
  };

  if (!parentFolderId) {
    return {
      newTree: [...items, createdFile],
      createdFile,
    };
  }

  function insert(nodes: ProjectItem[]): ProjectItem[] {
    return nodes.map((node) => {
      if (node.id === parentFolderId && node.type === 'folder') {
        const subPath = `${node.path}/${cleanName}`;
        createdFile = {
          ...createdFile,
          path: subPath,
        };
        return {
          ...node,
          isOpen: true,
          children: [...(node.children || []), createdFile],
        };
      }
      if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: insert(node.children),
        };
      }
      return node;
    });
  }

  return {
    newTree: insert(items),
    createdFile,
  };
}

/**
 * Crée un nouveau sous-dossier dans un dossier cible (ou à la racine)
 */
export function createFolderInTree(
  items: ProjectItem[],
  parentFolderId: string | null,
  folderName: string
): ProjectItem[] {
  const folderId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newFolder: ProjectItem = {
    id: folderId,
    name: folderName,
    path: folderName,
    type: 'folder',
    isOpen: true,
    children: [],
  };

  if (!parentFolderId) {
    return [...items, newFolder];
  }

  function insert(nodes: ProjectItem[]): ProjectItem[] {
    return nodes.map((node) => {
      if (node.id === parentFolderId && node.type === 'folder') {
        return {
          ...node,
          isOpen: true,
          children: [
            ...(node.children || []),
            {
              ...newFolder,
              path: `${node.path}/${folderName}`,
            },
          ],
        };
      }
      if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: insert(node.children),
        };
      }
      return node;
    });
  }

  return insert(items);
}

/**
 * Supprime un élément (fichier ou dossier récursivement)
 */
export function deleteItemFromTree(items: ProjectItem[], itemId: string): ProjectItem[] {
  return items
    .filter((item) => item.id !== itemId)
    .map((item) => {
      if (item.type === 'folder' && item.children) {
        return {
          ...item,
          children: deleteItemFromTree(item.children, itemId),
        };
      }
      return item;
    });
}

/**
 * Renomme un élément (fichier ou dossier)
 */
export function renameItemInTree(
  items: ProjectItem[],
  itemId: string,
  newName: string
): ProjectItem[] {
  return items.map((item) => {
    if (item.id === itemId) {
      const parentPath = item.path.includes('/')
        ? item.path.substring(0, item.path.lastIndexOf('/'))
        : '';
      const newPath = parentPath ? `${parentPath}/${newName}` : newName;
      return {
        ...item,
        name: newName,
        path: newPath,
      };
    }
    if (item.type === 'folder' && item.children) {
      return {
        ...item,
        children: renameItemInTree(item.children, itemId, newName),
      };
    }
    return item;
  });
}

/**
 * Importe un répertoire complet sélectionné via <input type="file" webkitdirectory directory multiple>
 */
export async function loadDirectoryFromFiles(files: FileList | File[]): Promise<{
  rootName: string;
  tree: ProjectItem[];
  firstFileId?: string;
}> {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) {
    throw new Error('Aucun fichier sélectionné dans le dossier.');
  }

  // Déterminer le nom du dossier racine
  let rootName = 'Dossier_Importe';
  const firstPath = (fileArray[0] as any).webkitRelativePath || fileArray[0].name;
  if (firstPath.includes('/')) {
    rootName = firstPath.split('/')[0];
  }

  // Structure intermédiaire par chemin
  interface FolderMap {
    [path: string]: {
      name: string;
      folders: Set<string>;
      files: { name: string; file: File; fullPath: string }[];
    };
  }

  const folderMap: FolderMap = {
    '': { name: rootName, folders: new Set(), files: [] },
  };

  for (const file of fileArray) {
    const relativePath = (file as any).webkitRelativePath || file.name;
    const parts = relativePath.split('/');

    // Si le premier élément est le nom de la racine, on l'enlève pour la hiérarchie interne
    const internalParts = parts.length > 1 ? parts.slice(1) : parts;
    const fileName = internalParts[internalParts.length - 1];

    // Ignorer les fichiers cachés ou node_modules, .git
    if (
      relativePath.includes('/.') ||
      relativePath.startsWith('.') ||
      relativePath.includes('node_modules') ||
      relativePath.includes('.git')
    ) {
      continue;
    }

    // Filtrer les extensions pertinentes : .md, .markdown, .txt, .docx
    const lower = fileName.toLowerCase();
    if (
      !lower.endsWith('.md') &&
      !lower.endsWith('.markdown') &&
      !lower.endsWith('.txt') &&
      !lower.endsWith('.docx')
    ) {
      continue;
    }

    const folderPath = internalParts.slice(0, -1).join('/');

    // Enregistrer les dossiers intermédiaires
    let cur = '';
    for (let i = 0; i < internalParts.length - 1; i++) {
      const part = internalParts[i];
      const next = cur ? `${cur}/${part}` : part;
      if (!folderMap[cur]) {
        folderMap[cur] = { name: cur.split('/').pop() || '', folders: new Set(), files: [] };
      }
      folderMap[cur].folders.add(next);
      if (!folderMap[next]) {
        folderMap[next] = { name: part, folders: new Set(), files: [] };
      }
      cur = next;
    }

    if (!folderMap[folderPath]) {
      folderMap[folderPath] = {
        name: folderPath.split('/').pop() || '',
        folders: new Set(),
        files: [],
      };
    }
    folderMap[folderPath].files.push({ name: fileName, file, fullPath: relativePath });
  }

  // Transformer folderMap en ProjectItem[] récursif
  let firstFoundFileId: string | undefined;

  async function buildLevel(currentPath: string): Promise<ProjectItem[]> {
    const entry = folderMap[currentPath];
    if (!entry) return [];

    const items: ProjectItem[] = [];

    // Ajouter les sous-dossiers
    for (const subFolderPath of Array.from(entry.folders).sort()) {
      const subName = subFolderPath.split('/').pop() || subFolderPath;
      const children = await buildLevel(subFolderPath);
      items.push({
        id: `folder-${subFolderPath.replace(/\W/g, '_')}`,
        name: subName,
        path: subFolderPath,
        type: 'folder',
        isOpen: true,
        children,
      });
    }

    // Ajouter les fichiers
    for (const fileObj of entry.files.sort((a, b) => a.name.localeCompare(b.name))) {
      let content = '';
      const isDocx = fileObj.name.toLowerCase().endsWith('.docx');

      if (isDocx) {
        try {
          const docxResult = await convertDocxToMarkdown(fileObj.file);
          content = docxResult.markdown;
        } catch {
          content = `# ${fileObj.name}\n\n(Impossible d'extraire le document Word)\n`;
        }
      } else {
        content = await fileObj.file.text();
      }

      const fileId = `file-${fileObj.fullPath.replace(/\W/g, '_')}`;
      if (!firstFoundFileId) {
        firstFoundFileId = fileId;
      }

      items.push({
        id: fileId,
        name: fileObj.name,
        path: currentPath ? `${currentPath}/${fileObj.name}` : fileObj.name,
        type: 'file',
        content,
        isModified: false,
      });
    }

    return items;
  }

  const tree = await buildLevel('');
  return {
    rootName,
    tree,
    firstFileId: firstFoundFileId,
  };
}

/**
 * Exporte l'ensemble d'un répertoire sous forme d'archive .ZIP
 * Options :
 * - 'docx' : convertit tous les fichiers Markdown en documents Word .docx bien formés
 * - 'markdown' : archive tous les fichiers Markdown .md mis à jour
 * - 'both' : inclut les deux formats
 */
export async function exportProjectToZip(
  tree: ProjectItem[],
  rootName: string,
  exportType: 'docx' | 'markdown' | 'both',
  docxOptions: DocumentOptions,
  onProgress?: (current: number, total: number, currentName: string) => void
): Promise<Blob> {
  const zip = new JSZip();
  const allFiles = getAllFiles(tree);
  const total = allFiles.length;

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const content = file.content || '';
    const cleanBaseName = file.name.replace(/\.(md|markdown|txt|docx)$/i, '');
    const dirPrefix = file.path.includes('/')
      ? file.path.substring(0, file.path.lastIndexOf('/') + 1)
      : '';

    if (onProgress) {
      onProgress(i + 1, total, file.name);
    }

    // Export en Markdown
    if (exportType === 'markdown' || exportType === 'both') {
      const mdPath = `${dirPrefix}${cleanBaseName}.md`;
      zip.file(mdPath, content);
    }

    // Export en Word (.docx)
    if (exportType === 'docx' || exportType === 'both') {
      const docxPath = `${dirPrefix}${cleanBaseName}.docx`;
      const fileOptions: DocumentOptions = {
        ...docxOptions,
        title: cleanBaseName.replace(/_/g, ' '),
      };
      try {
        const docxBlob = await generateWordDocument(content, fileOptions);
        zip.file(docxPath, docxBlob);
      } catch (err) {
        console.error(`Erreur génération docx pour ${file.name}:`, err);
        // Fallback fichier texte
        zip.file(`${dirPrefix}${cleanBaseName}_erreur.txt`, content);
      }
    }
  }

  return zip.generateAsync({ type: 'blob' });
}
