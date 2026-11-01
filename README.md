# Nini · suivi des dossiers

Application web pour un·e **collaborateur·rice comptable** : suivre les dossiers clients, les tâches et les échéances, mesurer le temps passé, et produire des rapports sur ce qui a été fait et ce qu'il reste à faire.

Projet **100 % open source** (licence MIT), comme toutes ses dépendances.

## Fonctionnalités

- **Aujourd'hui** : retards, tâches du jour, les 7 prochains jours classés par date, tâches en attente du client (avec le nombre de jours depuis la relance).
- **Toutes les tâches** : recherche et filtres (dossier, statut, échéance, catégorie, priorité), affichage en **liste** ou en **tableau** par statut avec glisser-déposer. Ajout rapide au clavier.
- **Panneau de tâche** : enregistrement automatique, statut, échéance, priorité, catégorie, estimation, **récurrence** (l'occurrence suivante est créée quand la tâche est terminée), **étapes**, **temps passé** (saisie libre « 1h30 » ou **chrono**), **fil d'activité** (commentaires et historique automatique des changements).
- **Dossiers** : forme juridique, IS/IR, régime de TVA, clôture, paie, contact, honoraires, **budget temps**, notes ; avancement de l'année et retards par dossier ; archivage.
- **Poser les échéances** : crée en un clic les tâches de l'année pour un ou plusieurs dossiers : TVA (CA3 mensuelle ou trimestrielle, acomptes et CA12), paie et DSN, collecte des pièces, révision, liasse (2065, 2031/2035, 2072), acomptes et solde d'IS, AG, dépôt au greffe, CFE. Une échéance déjà créée ne l'est jamais deux fois.
- **Calendrier** mensuel des échéances.
- **Rapports** par période et par dossier : travaux réalisés, reste à faire, retards, temps passé. **Impression / PDF** et **export Excel (CSV)**.
- **Palette de commandes** (`⌘K` / `Ctrl+K`), raccourci `N` pour une nouvelle tâche, **annulation** après une suppression ou une tâche cochée.
- Thème clair ou sombre automatique, utilisable sur téléphone.

> ⚠️ Les dates proposées sont des **dates usuelles** du calendrier fiscal. Elles servent à planifier le travail et restent modifiables. Elles sont à vérifier pour chaque dossier (jour limite de TVA, option EDI, exercices décalés…).

## Stack

| Rôle | Outil | Licence |
|---|---|---|
| Interface | [React](https://react.dev) 19 + [TypeScript](https://www.typescriptlang.org) | MIT / Apache-2.0 |
| Outil de build | [Vite](https://vite.dev) | MIT |
| Navigation | [React Router](https://reactrouter.com) | MIT |
| Base de données, comptes, synchronisation | [Supabase](https://supabase.com) (PostgreSQL), auto-hébergeable | Apache-2.0 |
| Palette de commandes | [cmdk](https://cmdk.paco.me) | MIT |
| Icônes | [Lucide](https://lucide.dev) | ISC |
| Typographie | [Geist](https://vercel.com/font) via Fontsource | OFL-1.1 |
| Tests | [Vitest](https://vitest.dev) | MIT |

## Démarrer

Prérequis : [Node.js](https://nodejs.org) 20 ou plus.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests de la logique métier (échéances, récurrence, rapports)
npm run build      # version de production dans dist/
```

## Deux modes de stockage

### 1. Mode local (par défaut)

Sans configuration, les données restent **dans le navigateur** (`localStorage`). Rien ne quitte l'appareil. Pense à faire **Réglages → Exporter une sauvegarde** de temps en temps. Si la première version de l'app a été utilisée à la même adresse, ses données sont reprises automatiquement.

### 2. Mode synchronisé (Supabase)

Pour retrouver les mêmes données sur ordinateur et téléphone, avec un compte protégé par mot de passe :

1. Crée une instance Supabase :
   - **soit** un projet gratuit sur [supabase.com](https://supabase.com) ;
   - **soit** une instance **auto-hébergée** avec Docker, en suivant le [guide officiel](https://supabase.com/docs/guides/self-hosting/docker). Le code de Supabase est open source.
2. Dans l'éditeur SQL de Supabase, exécute [`supabase/schema.sql`](supabase/schema.sql). Il crée les tables `clients`, `tasks` et `settings`, la sécurité ligne par ligne (chaque compte ne voit que ses données) et la synchronisation en temps réel.
3. Copie `.env.example` en `.env` et renseigne l'URL et la clé `anon` de l'instance (*Project Settings → API*).
4. Relance `npm run dev` (ou refais le build). L'app demande alors de se connecter. La connexion se fait par e-mail et mot de passe, ou par lien envoyé par e-mail (ce qui demande un serveur SMTP configuré dans Supabase).

Pour passer du mode local au mode synchronisé : **Réglages → Exporter une sauvegarde** en mode local, puis **Restaurer** une fois connecté.

## Mettre en ligne

`npm run build` produit des fichiers statiques dans `dist/`. Ils fonctionnent sur n'importe quel hébergement, y compris dans un sous-dossier, car l'app utilise des adresses en `#/…` : Nginx, Caddy, Apache, [Codeberg Pages](https://codeberg.page), GitHub Pages, un NAS…

## Organisation du code

```
src/
  domain/      logique métier pure et testée (types, règles des tâches, échéances fiscales, rapports, données d'exemple)
  data/        stockage : interface Repo + implémentations locale et Supabase, état de l'app (AppStore)
  components/  barre latérale, panneau de tâche, palette ⌘K, fenêtres, lignes de tâches…
  pages/       Aujourd'hui, Tâches, Dossiers, Fiche dossier, Calendrier, Rapports, Réglages, Connexion
  lib/         dates, formats, fichiers (CSV, téléchargements)
  styles/      feuille de style unique (variables, thème sombre, mobile, impression)
supabase/schema.sql   schéma de base de données et règles d'accès
```

## Licence

[MIT](LICENSE)
