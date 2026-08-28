# Architecture Technique — ERNET STORE

ERNET STORE est une plateforme e-commerce B2B/B2C pour le matériel informatique au Maroc. Le projet actuel est un MVP full-stack JavaScript, orienté catalogue fournisseur, recherche rapide, panier, commandes et paiement CMI.

## Stack Actuelle

### Frontend

- React 18 avec Vite.
- React Router pour les pages publiques, compte client et admin.
- Axios pour l'API, avec JWT en cookie httpOnly côté serveur et compatibilité token localStorage pendant le MVP.
- Socket.IO client pour les événements temps réel.
- CSS custom dans `client/src/index.css`.

### Backend

- Node.js 18+ avec Express 4.
- Prisma 5 avec PostgreSQL comme source de vérité.
- Redis via `ioredis` pour cache et usages temps réel.
- Meilisearch pour recherche catalogue avec fallback Prisma si le moteur est indisponible.
- Socket.IO pour notifications et mises à jour stock.
- Zod pour validation des entrées.
- Helmet, CORS strict et rate limiting Express.

### Intégrations

- Disway : téléchargement/parsing Excel, mapping produits, normalisation catégories/marques, marge automatique, déduplication des slugs, upsert en base et reconstruction de l'index recherche.
- CMI : initiation paiement, callback serveur, vérification de signature en production, retour utilisateur.

## Structure

```text
client/                 Application React + Vite
  src/api/              Client HTTP Axios
  src/components/       UI partagée
  src/context/          Auth, panier, langue, socket
  src/pages/            Pages publiques, compte, admin

server/                 API Express
  prisma/               Schéma Prisma et seed
  src/config/           Env, Prisma, Redis, Meilisearch
  src/controllers/      Contrôleurs REST
  src/middleware/       Auth, erreurs, rate limiting
  src/routes/           Routes API
  src/services/         Disway, CMI, pricing, search, sync
  src/socket/           Socket.IO
  src/utils/            Helpers

docs/                   Documentation technique
```

## Flux Catalogue

1. Un fichier Disway est récupéré depuis le portail, une URL configurée ou `server/uploads/latest.xlsx`.
2. Le parser lit les feuilles Excel, détecte les colonnes utiles et ignore les lignes non produit.
3. Les produits sont normalisés : SKU, nom enrichi, prix, stock, marque, catégorie, slug unique.
4. `bulkImport` upsert les produits via Prisma.
5. L'index Meilisearch est reconstruit depuis PostgreSQL pour éviter les documents obsolètes.
6. Si Meilisearch est indisponible, l'API catalogue bascule sur une recherche Prisma.

## Flux Auth

1. Register/login valident les entrées avec Zod.
2. Les mots de passe sont hashés avec bcryptjs.
3. Le serveur émet un JWT.
4. Le JWT est posé en cookie httpOnly et aussi retourné au client pour compatibilité MVP.
5. `protect` accepte le Bearer token ou le cookie sécurisé.

## Flux Paiement CMI

1. L'utilisateur authentifié initie un paiement pour sa propre commande.
2. Le serveur génère les paramètres CMI avec `API_URL` comme callback serveur et `CLIENT_URL` comme retour utilisateur.
3. Le callback CMI met à jour la commande après vérification de signature.
4. En production, les variables CMI sont obligatoires et le hash callback est requis.

## Sécurité Implémentée

- Validation Zod sur auth et paiement.
- bcryptjs pour les mots de passe.
- JWT avec secret obligatoire et long en production.
- Cookie httpOnly en complément du Bearer token.
- CORS limité à `CLIENT_URL`.
- Helmet activé, CSP en production.
- Rate limiting global, auth, register et tâches lourdes.
- Gestion d'erreurs centralisée sans fuite de stack en production.
- `.gitignore` protège `.env`, uploads, logs, dumps locaux, images et archives.

## Limites Connues

- Le frontend Vite ne fournit pas de SSR : SEO correct pour pages statiques, mais moins optimal pour fiches produits dynamiques qu'un Next.js SSR/ISR.
- Les tests sont encore minimaux.
- L'auth devrait idéalement passer entièrement en cookies httpOnly et supprimer la dépendance `localStorage` après stabilisation.
- Les imports Disway restent dépendants de la structure des fichiers fournisseur.
- Pas encore de CI/CD, monitoring, backups automatisés ni environnement staging.

## Roadmap Technique

1. Ajouter tests d'intégration API pour auth, catalogue, panier, commandes et paiement.
2. Ajouter CI GitHub Actions : install, lint, test, build.
3. Ajouter Docker Compose pour PostgreSQL, Redis, Meilisearch, API et client.
4. Remplacer les scripts de diagnostic par des commandes documentées.
5. Migrer vers Next.js uniquement si le SEO produit devient prioritaire.
