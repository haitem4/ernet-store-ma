# 🔒 Sécurité — ERNET STORE

Ce document récapitule les mesures de sécurité mises en place sur la plateforme
e-commerce ERNERSTORE (backend Express + PostgreSQL + Redis + Meilisearch).

## Mesures implémentées

### 1. Authentification & mots de passe

- **JWT** (JSON Web Token) pour les sessions utilisateur, avec expiration (`7j` par défaut).
- **bcryptjs** avec un salage de **10 rounds** pour le hachage des mots de passe.
- **Validation stricte** des entrées via **Zod** (email, longueur min 8 caractères pour le mot de passe).
- Comptes **B2B** en statut `PENDING` jusqu'à validation manuelle par un admin.
- Le hash du mot de passe n'est **jamais** renvoyé à l'API (objet `sanitize`).

### 2. Rate limiting (anti brute force / DDoS)

Nouveau middleware `server/src/middleware/rateLimit.js` :

- **`apiLimiter`** : 300 requêtes / 15 min / IP (appliqué globalement sur `/api`).
- **`authLimiter`** : 10 tentatives de connexion / 15 min / IP (sur `/login`).
- **`registerLimiter`** : 5 inscriptions / heure / IP (sur `/register`).
- **`heavyTaskLimiter`** : 5 opérations lourdes / heure / IP (import Disway, rebuild index).

### 3. En-têtes HTTP (Helmet)

- `helmet()` active les en-têtes de sécurité : `X-Content-Type-Options`,
  `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, etc.
- CSP désactivée en développement (pour Vite HMR), **activée en production**.

### 4. CORS (contrôle d'accès)

- Origines **strictement autorisées** via `CLIENT_URL` (supporte plusieurs origines séparées par des virgules).
- Requêtes avec origine non autorisée → **bloquées**.
- Méthodes et en-têtes limités.

### 5. Contrôle d'accès par rôles

- Middleware `protect` : vérifie le JWT et charge l'utilisateur.
- Middleware `authorize(...roles)` : restreint l'accès (ADMIN, B2B, B2C).
- Les routes admin exigent le rôle **ADMIN** + rate limiting renforcé.

### 6. Validation de l'environnement

- En **production**, le serveur **refuse de démarrer** si :
  - `DATABASE_URL`, `JWT_SECRET` ou `MEILISEARCH_MASTER_KEY` sont absents.
  - `JWT_SECRET` est le secret par défaut (`dev_secret`) ou < 32 caractères.
- En développement, les valeurs par défaut sont acceptées pour faciliter le dev.

### 7. Limites de taille des requêtes

- Limite JSON : **1 Mo** (au lieu de 10 Mo).
- Limite `urlencoded` : **1 Mo**.

### 8. Gestion des erreurs

- Gestion centralisée via `errorHandler` (codes Prisma et Zod).
- **Aucune fuite de stack trace** dans les réponses API.

## Recommandations pour la mise en production

1. **Générer un secret JWT fort** (min 32 caractères) :

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Puis définir `JWT_SECRET` dans `.env`.

2. **Forcer HTTPS** : placer l'API derrière un reverse proxy (Nginx, Caddy)
   avec TLS, et activer HSTS via Helmet en production.

3. **Base de données** : utiliser des identifiants PostgreSQL à privilèges limités,
   et sauvegardes régulières.

4. **Redis** : activer l'authentification `requirepass` et limiter l'accès réseau.

5. **Meilisearch** : définir une clé master forte (`MEILISEARCH_MASTER_KEY`).

6. **Variables obligatoires en production** :
   `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL`.

## Variables d'environnement de sécurité

```env
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=un_secret_fort_d_au_moins_32_caracteres
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://...
MEILISEARCH_MASTER_KEY=une_cle_forte
```
