# Nini · suivi des dossiers

Application web pour un·e **collaborateur·rice comptable** : suivre les dossiers clients, les tâches et les échéances, mesurer le temps passé, et produire des rapports sur ce qui a été fait et ce qu'il reste à faire.

Projet **100 % open source** (licence MIT), comme toutes ses dépendances.

## Au bureau : un seul fichier, rien à installer

[`release/Nini.html`](release/Nini.html) contient toute l'application dans **un seul fichier**.

1. Copier `Nini.html` dans un dossier personnel du PC (par exemple *Documents*). Ne plus le déplacer ensuite.
2. L'ouvrir par double-clic dans **Edge** ou **Chrome**, et l'ajouter aux favoris.

**Pourquoi c'est sûr pour les données :**
- pas de serveur, pas de compte, pas de cloud : tout reste dans le navigateur de ce PC ;
- le fichier contient une règle de sécurité (*Content-Security-Policy*) qui **interdit au navigateur toute connexion réseau** depuis l'app. Même en cas de bug, aucune donnée ne peut partir sur Internet ;
- **sauvegardes** : un rappel s'affiche après 7 jours sans sauvegarde. Le bouton télécharge un fichier `.json` à ranger sur un lecteur sauvegardé par le cabinet. Il se restaure via *Réglages → Restaurer*.

À savoir : effacer les données de navigation du navigateur efface aussi celles de l'app, d'où l'importance des sauvegardes. Il vaut mieux vérifier avec le responsable informatique que l'usage d'un fichier HTML local est autorisé.

Pour régénérer le fichier après une modification du code : `npm run build:offline`.

## Sur iPad : une app installée, puis 100 % hors ligne

L'iPad ne sait pas faire tourner un fichier HTML ouvert depuis l'app Fichiers. On installe donc Nini comme une app :

1. **Une seule fois, avec Internet** : ouvrir l'adresse de l'app dans Safari.
2. **Partager → Sur l'écran d'accueil → Ajouter.**
3. Ouvrir Nini **depuis son icône**, puis *Réglages → Restaurer* et choisir la sauvegarde reçue par AirDrop.
4. Ensuite, Wi-Fi coupé ou en mode avion : Nini fonctionne normalement.

L'app ne se connecte jamais à rien. Une fois installée, elle est servie uniquement depuis la mémoire de l'iPad, et toute requête vers l'extérieur est refusée. Sur iPad, « Exporter une sauvegarde » ouvre la feuille de partage (AirDrop, *Enregistrer dans Fichiers*).

⚠️ Supprimer l'icône de l'écran d'accueil efface les données de l'app sur l'iPad.

**Publication** : `npm run build:pwa` produit `dist-pwa/` (6 fichiers statiques, à héberger n'importe où en HTTPS). Avec GitHub Pages : *Settings → Pages → Source : GitHub Actions*, puis *Actions → Publier l'app iPad → Run workflow*. Sur un compte GitHub gratuit, Pages exige un dépôt public. Le code ne contient aucune donnée client.

## Preuve qu'aucune donnée ne sort

*Réglages → Sécurité* affiche l'état du verrou et un **journal de sécurité** tenu sur l'appareil. Il ne peut pas être effacé depuis l'app et garde les 1 000 dernières entrées. On y trouve :
- chaque ouverture de l'app, avec l'état du verrou ;
- chaque tentative de connexion **bloquée par le navigateur** (événements `securitypolicyviolation`) ;
- chaque requête refusée par le module hors ligne sur iPad ;
- une **alerte** si une ressource externe a réellement été chargée sans être bloquée (contrôle indépendant via `PerformanceObserver`) ;
- chaque export ou restauration volontaire de fichier.

Le bouton **Tester le verrou** tente 4 envois (fetch, beacon, image, WebSocket) vers un domaine réservé `.invalid`, qui n'existe pas. Chaque canal doit apparaître « bloqué ». Le journal s'exporte en CSV. Vérification indépendante : outils de développement (F12 → Réseau) sur PC, mode avion sur iPad.

## Documentation

- [`docs/nini-guide-complet.pdf`](docs/nini-guide-complet.pdf) : le guide complet, écran par écran, avec captures (26 pages).
- [`docs/nini-mode-emploi.pdf`](docs/nini-mode-emploi.pdf) : le mode d'emploi court (4 pages).

Les sources LaTeX sont à côté. Pour compiler : `xelatex` (deux passes pour le sommaire). Les captures utilisent uniquement les données d'exemple.

## Fonctionnalités

- **Aujourd'hui** : retards, tâches du jour, les 7 prochains jours classés par date, tâches en attente du client (avec le nombre de jours depuis la relance).
- **Toutes les tâches** : recherche et filtres (dossier, statut, échéance, catégorie, priorité), affichage en **liste** ou en **tableau** par statut avec glisser-déposer. Ajout rapide au clavier.
- **Panneau de tâche** : enregistrement automatique, statut, échéance, priorité, catégorie, estimation, **récurrence** (l'occurrence suivante est créée quand la tâche est terminée), **étapes**, **temps passé** (saisie libre « 1h30 » ou **chrono**), **fil d'activité** (commentaires et historique automatique des changements).
- **Dossiers** : forme juridique, IS/IR, régime de TVA, clôture, paie, contact, honoraires, **budget temps**, notes ; avancement de l'année et retards par dossier ; archivage.
- **Poser les échéances** : crée en un clic les tâches de l'année pour un ou plusieurs dossiers : TVA (CA3 mensuelle ou trimestrielle, acomptes et CA12), paie et DSN, collecte des pièces, révision, liasse (2065, 2031/2035, 2072), acomptes et solde d'IS, AG, dépôt au greffe, CFE. Une échéance déjà créée ne l'est jamais deux fois.
- **Répartition du mois** : chaque dossier a un manager et un temps alloué (en jours par mois). L'app propose un planning jour par jour :
  - les dossiers ayant une période réservée (par exemple du 5 au 10) sont placés en premier ;
  - le temps de chaque dossier est réparti sur les périodes de la routine (début, milieu, TVA, fin) ;
  - en période TVA, les dossiers dont la date limite (19, 21 ou 24) est la plus proche passent en premier ;
  - un dossier sans TVA n'est jamais placé en période TVA.

  Tout se modifie ensuite à la main : glisser-déposer d'un jour à l'autre, durée, ajout et suppression de créneaux, temps alloué. Le tableau « Équilibre » montre l'écart entre le temps planifié et le temps alloué.
- **Routine mensuelle** modifiable (*Réglages*) : périodes, échéances et étapes. Le bouton « Créer les tâches du mois » génère une tâche par dossier et par période, avec ses étapes à cocher, plus le tableau de variation du CA et un point par manager.
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
