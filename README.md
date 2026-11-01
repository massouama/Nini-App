# Nini · Suivi des dossiers

Application web de suivi pour un·e **collaborateur·rice comptable** : une sorte d'ITSM perso pour gérer tous les dossiers clients, les tâches et les échéances, et produire des rapports sur ce qui a été fait et ce qu'il reste à faire.

Elle n'a **aucune dépendance** et ne demande **ni serveur ni installation** : il suffit d'ouvrir `index.html` dans un navigateur.

## Fonctionnalités

| Écran | Ce qu'on y trouve |
|---|---|
| **Accueil** | Indicateurs (tâches ouvertes, en retard, échéances à 7 jours, en attente client, terminées et temps du mois), listes « En retard », « Prochaines échéances », « En cours », « En attente client » (avec le nombre de jours d'attente), avancement de chaque dossier sur l'année. |
| **Tâches** | Toutes les tâches présentées comme des tickets. Recherche, filtres (dossier, statut, échéance, catégorie, priorité), tris, vue **liste** ou **kanban** avec glisser-déposer. |
| **Fiche tâche** | Statut, priorité, catégorie, échéance, estimation, **étapes** (checklist), **temps passé** (saisie libre « 1h30 » ou **chrono**), **journal** horodaté (commentaires et historique automatique des changements), **récurrence** (la tâche suivante est créée quand celle-ci est terminée), duplication. |
| **Dossiers** | Fiche client : SIREN, forme juridique, IS/IR, régime de TVA, date de clôture, paie, contact, honoraires, **budget temps**, notes. Statistiques par dossier : retards, avancement, temps passé par rapport au budget. Archivage. |
| **Poser les échéances** | Crée en un clic les tâches de l'année pour un dossier ou pour tous : TVA (CA3 mensuelle ou trimestrielle, acomptes et CA12), paie/DSN, collecte des pièces, révision et bilan, liasse (2065, 2031/2035, 2072), acomptes et solde d'IS, AG, dépôt au greffe, CFE. Les échéances déjà créées ne sont jamais générées deux fois. |
| **Calendrier** | Vue mensuelle des échéances, filtrable par dossier. Un clic sur un jour crée une tâche à cette date. |
| **Rapports** | Rapport d'activité par période (semaine, mois, trimestre, année ou dates libres) et par dossier : travaux réalisés, reste à faire, retards, attente client, temps passé, synthèse par dossier. **Impression / PDF** et **export Excel (CSV)**. |
| **Réglages** | Prénom, sauvegarde et restauration (JSON), exports CSV des tâches et des dossiers, données de démonstration, remise à zéro. |

Raccourci clavier : **N** crée une nouvelle tâche.

> ⚠️ Les dates des échéances sont des **dates usuelles** du calendrier fiscal. Elles servent à planifier le travail et peuvent être modifiées. Elles sont à vérifier pour chaque dossier (jour limite de TVA, option EDI, exercices décalés, etc.).

## Données & sauvegarde

Les données sont enregistrées **uniquement dans le navigateur** (`localStorage`) : rien ne part sur Internet. Conséquences :

- les données sont propres à un navigateur sur un appareil donné ;
- il faut faire **Réglages → Exporter une sauvegarde** régulièrement, et pour passer d'un appareil à un autre (puis « Restaurer une sauvegarde ») ;
- vider les données du navigateur efface tout.

## Utilisation

- **En local** : double-cliquer sur `index.html`.
- **En ligne (GitHub Pages)** : dans le dépôt GitHub, aller dans *Settings → Pages*, choisir la branche et le dossier `/ (root)`. L'app est alors accessible à l'adresse `https://<utilisateur>.github.io/<dépôt>/`. Même en ligne, les données restent dans le navigateur de chaque personne.

## Structure

```
index.html            Coquille de l'app (navigation, modale)
css/styles.css        Styles (clair/sombre automatique, mobile, impression)
js/utils.js           Dates, durées, formatage, export CSV
js/store.js           Modèle de données, référentiels, stockage local, règles métier
js/obligations.js     Générateur d'échéances fiscales, sociales et juridiques
js/app.js             Vues, modales, rapports, chrono, routeur, données de démo
```
