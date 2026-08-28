# ERNET STORE — Plateforme E-Commerce IT & B2B (Maroc)

Distributeur de matériel informatique, serveurs d'entreprise, réseaux, PC et composants high-tech au Maroc.

---

## 🏗️ Architecture

- **Frontend** : React 18, Vite, React Router 6, CSS Modulaire & Responsive.
- **Backend** : Node.js, Express, Prisma ORM, Socket.IO.
- **Base de données** : PostgreSQL 15+, Redis (cache), Meilisearch (recherche rapide avec repli PostgreSQL).

---

## 🚀 Démarrage en Développement

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer PostgreSQL (port 5432)

# 3. Lancer l'application complète (Front + Back)
npm run dev
```

- **Frontend** : [http://localhost:5173](http://localhost:5173)
- **Backend API** : [http://localhost:4001](http://localhost:4001)

---

## 📦 Déploiement Netlify

### Méthode 1 : Netlify Drop (Le plus rapide)
1. Construire le frontend :
   ```bash
   npm run build
   ```
2. Glisser-déposer le dossier `client/dist` sur [app.netlify.com/drop](https://app.netlify.com/drop).

### Méthode 2 : GitHub CI/CD
Connecter le dépôt GitHub sur Netlify :
- **Build command** : `npm run build`
- **Publish directory** : `client/dist`

