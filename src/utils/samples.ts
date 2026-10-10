export interface MarkdownSample {
  id: string;
  name: string;
  description: string;
  filename: string;
  content: string;
}

export const SAMPLES: MarkdownSample[] = [
  {
    id: 'rapport-activite',
    name: "Rapport d'activité",
    description: 'Structure formelle avec objectifs, métriques et tableau de synthèse',
    filename: 'Rapport_Activite_2026.docx',
    content: `# Rapport Annuel d'Activité et Performance 2026

**Auteur :** Direction des Systèmes d'Information & Projets  
**Date :** 13 Septembre 2026  
**Statut :** Validé  

---

## 1. Synthèse Exécutive

L'exercice 2026 a été marqué par une accélération majeure de la modernisation des outils collaboratifs et des plateformes numériques. Grâce à l'engagement des équipes, l'ensemble des objectifs stratégiques a été dépassé.

> *"La transformation numérique n'est pas seulement technologique, elle repose avant tout sur la clarté de l'information et la fluidité des échanges entre collaborateurs."*

### Indicateurs Clés de Réussite
- **99,95%** de disponibilité moyenne sur les services critiques
- **+35%** d'adoption des applications de traitement documentaire
- Réduction de **40%** des délais de validation des comptes-rendus

---

## 2. Bilan des Projets par Pôle

Le tableau suivant récapitule les investissements et les résultats obtenus par département :

| Pôle d'Activité | Projet Réalisé | Budget Alloué | Taux d'Achèvement | Impact Métier |
| :--- | :--- | :--- | :--- | :--- |
| **Bureautique** | Conversion Markdown & Word | 45 000 € | 100% | Élevé |
| **Infrastructure** | Migration Cloud Sécurisée | 120 000 € | 95% | Critique |
| **Support Client** | Refonte du portail usagers | 60 000 € | 100% | Modéré |
| **Sécurité** | Audit & Certification ISO | 35 000 € | 100% | Majeur |

---

## 3. Plan d'Actions Prioritaires

Pour le prochain trimestre, les actions prioritaires sont ventilées comme suit :

1. Déploiement de l'application sur les postes Windows via le format PWA
2. Formation des référents métiers à la rédaction en Markdown
3. Automatisation des flux d'exportation vers Microsoft Word

### Tâches Techniques en Cours :
- [x] Implémentation du parseur Markdown conforme et sécurisé
- [x] Génération native des fichiers .docx avec typographie professionnelle
- [x] Prise en charge du fonctionnement hors-ligne (service worker)
- [ ] Interconnexion avec les modèles de chartes graphiques d'entreprise

---

## 4. Recommandations et Conclusion

Il est vivement conseillé de pérenniser l'usage des formats légers et universels comme le Markdown pour la rédaction initiale, complété par l'exportation Word pour la diffusion officielle auprès des partenaires externes.
`
  },
  {
    id: 'reunion-cr',
    name: 'Compte-rendu de réunion',
    description: 'Procès-verbal avec participants, décisions et plan d’action',
    filename: 'Compte_Rendu_Reunion.docx',
    content: `# Compte-Rendu : Comité de Pilotage Numérique

**Date de la séance :** 13 Septembre 2026 – 10h00 à 11h45  
**Lieu :** Salle Panoramique / Visioconférence Teams  
**Rédacteur :** Secrétariat de séance  

---

## 1. Participants et Émargement

### Présents :
- **M. Thomas Laurent** – Directeur de Projet
- **Mme Claire Dubois** – Responsable Qualité et Méthodes
- **M. David Moreau** – Architecte Solutions
- **Mme Sophie Bernard** – Chargée d'Accessibilité Numérique

### Excusés :
- M. Julien Mercier (remplacé par Mme Dubois)

---

## 2. Ordre du Jour

1. Approbation du compte-rendu de la réunion précédente
2. Suivi de l'accessibilité numérique (conformité RGAA / WCAG)
3. Validation du convertisseur bureautique Markdown vers Word
4. Questions diverses

---

## 3. Décisions Validées en Séance

> **Décision n° 2026-09-A :**  
> L'application doit être directement installable sur les postes de travail Windows 10 et Windows 11 sans nécessiter de droits administrateur élevés.

> **Décision n° 2026-09-B :**  
> Les documents Word exportés doivent comporter une pagination automatique ("Page X sur Y") et une mise en page aérée.

---

## 4. Matrice des Actions à Mener

| Action | Responsable | Échéance | Statut |
| :--- | :--- | :--- | :--- |
| Finaliser la charte typographique des titres | C. Dubois | 20/09/2026 | En cours |
| Valider le test d'installation sur Windows Edge/Chrome | D. Moreau | 18/09/2026 | À faire |
| Rédiger le guide d'utilisation synthétique | S. Bernard | 25/09/2026 | Planifié |
`
  },
  {
    id: 'doc-technique',
    name: 'Documentation technique',
    description: 'Guide technique avec blocs de code, commandes et architecture',
    filename: 'Documentation_Technique.docx',
    content: `# Spécification Technique & Guide d'Intégration

**Module :** Convertisseur Universel Markdown vers OpenXML / Word  
**Version :** 2.4.0-prod  
**Environnement cible :** Postes Windows (Edge / Chrome / Standalone)  

---

## 1. Vue d'Ensemble de l'Architecture

Le convertisseur s'exécute côté client dans un bac à sable isolé pour garantir la confidentialité absolue des données traitées. Aucun fichier Markdown ni document Word n'est transmis à un serveur distant.

\`\`\`text
[ Fichier Markdown (.md) ]
          │
          ▼
[ Parseur Sécurisé AST + Sanitisation ]
          │
    ┌─────┴────────────────┐
    ▼                      ▼
[ Rendu HTML A4 ]    [ Moteur docx (OpenXML) ]
    │                      │
    ▼                      ▼
(Lecture à l'écran)   (Fichier .docx téléchargeable)
\`\`\`

---

## 2. Syntaxe Markdown Prise en Charge

Le moteur interprète rigoureusement l'ensemble des éléments Markdown standards :

- **Titres hiérarchiques** : du niveau \`# H1\` jusqu'au niveau \`###### H6\`
- **Mises en relief** : **gras**, *italique*, \`code en ligne\`, ~~texte barré~~
- **Listes** : à puces ou numérotées avec imbrication
- **Tableaux complets** avec alignements gauche, centre et droite
- **Blocs de citations** avec bordure gauche élégante
- **Blocs de code multilignes** avec police proportionnelle

### Exemple de script d'installation :

\`\`\`bash
# Installation des dépendances du projet
npm install

# Lancement en environnement local
npm run dev

# Génération du binaire de production PWA
npm run build
\`\`\`

---

## 3. Sécurité et Gestion des Données

> **Principe de protection des données :**  
> Toutes les chaînes de caractères externes subissent une encapsulation stricte et un nettoyage anti-injection (XSS) avant tout affichage visuel.
`
  }
];
