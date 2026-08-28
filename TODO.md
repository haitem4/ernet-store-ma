# TODO — Correction import Disway

## Objectif

Corriger l'import Disway qui échoue sur 46 produits (slugs en double).

## Étapes

- [x] Améliorer la détection de la colonne nom dans `server/run-import.js`
      (combiner "Désignation" + colonne "format" via `buildName`)
- [x] Ajouter la déduplication des slugs (suffixe `-N`) dans `run-import.js`
- [x] Harmoniser `server/src/services/disway.service.js` (endpoint admin)
      avec la même logique `buildName` + slug dédupliqué
- [x] Ajouter la déduplication des slugs dans `server/src/services/sync.service.js`
      (`bulkImport` + résolution de conflit dans `upsertProduct`)
- [x] Relancer l'import et vérifier les produits importés sans échec lié aux slugs

## Résultat

- ✅ Import relancé : **141 produits en base, 141 slugs distincts** (0 échec slug en double)
- ✅ Noms produits enrichis (ex : « Cage / Format 2 baies / Tour » au lieu de « Cage / Format » répété)
- ✅ Vérification syntaxe JS OK (`run-import.js`, `disway.service.js`, `sync.service.js`)
- ℹ️ Meilisearch : warning « fetch failed » toléré (service non démarré localement, non bloquant)

## Restant (optionnel)

- [ ] Démarrer Meilisearch pour l'indexation recherche

## Amélioration — Filtres dynamiques du catalogue (session reprise)

- [x] `GET /api/products/meta` (« meta » déclaré avant `/:slug` dans les routes)
      → retourne les vraies catégories et marques actives avec leur nombre de produits
- [x] `client/src/pages/Catalogue.jsx` charge dynamiquement les catégories/marques
      depuis `/products/meta` (fini les listes codées en dur) ; transfert des filtres
      `brand`, `category`, `stock` au backend
- [x] `client/src/components/ProductCard.jsx` gère la marque en « string » (recherche)
      ou en « objet {name} » (Prisma) via la variable `brandName`
- [x] Vérifs : catégorie « Processeurs » → 1 produit ; marque « Intel » + stock=in → 1 produit
- [x] Build frontend OK (139 modules, `vite build` réussi)
