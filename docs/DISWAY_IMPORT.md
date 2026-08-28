# Automatisation de l'import des tarifs Disway

Cette fonctionnalité permet d'importer automatiquement votre fichier Excel
de tarifs Disway (fournisseur) dans le catalogue ERNERSTORE, en appliquant
votre marge de bénéfice sur chaque produit.

## Comment ça marche

Le service tente de récupérer le fichier de prix Disway dans cet ordre :

1. **Connexion automatique au portail Disway** (via Puppeteer, navigateur
   headless) avec vos identifiants revendeur, puis navigation vers la page
   « liste de prix » et téléchargement du fichier Excel.
2. **URL directe** (`DISWAY_XLSX_URL`) si une URL de téléchargement stable existe.
3. **Fichier local** placé dans `server/uploads/latest.xlsx`.

Ensuite :

- Pour chaque ligne, il applique la marge : **prix_public = tarif_fournisseur × 1.5**.
- Il enregistre le produit avec :
  - `costPrice` = tarif fournisseur (prix d'achat)
  - `price` = tarif fournisseur × marge (prix public B2C)
  - `supplier` = `"Disway"`
  - `supplierRef` = référence Disway
- Le produit est synchronisé dans PostgreSQL + index Meilisearch.

## Configuration (variables d'environnement)

Ajoutez ces variables dans votre fichier `.env` :

```env
# --- Option A (recommandée) : connexion automatique au portail Disway ---
DISWAY_LOGIN_URL=https://www.disway.com/profile/login?backurl=%2Fliste-de-prix
DISWAY_PRICE_LIST_URL=https://www.disway.com/liste-de-prix
DISWAY_EMAIL=votre-email-revendeur@exemple.com
DISWAY_PASSWORD=votre-mot-de-passe

# --- Option B : URL directe du fichier Excel Disway ---
# DISWAY_XLSX_URL=https://www.disway.ma/.../tarifs.xlsx

# --- Option C : fichier local (secours) ---
# Placez le fichier Excel téléchargé manuellement dans :
#   server/uploads/latest.xlsx

# --- Marge de bénéfice (×1.5 par défaut) ---
DISWAY_MARKUP=1.5

# --- Noms de colonnes personnalisables (optionnel) ---
# Si la détection automatique des colonnes échoue, précisez-les :
# DISWAY_COL_SKU=Référence
# DISWAY_COL_NAME=Désignation
# DISWAY_COL_PRICE=Prix
# DISWAY_COL_STOCK=Stock
# DISWAY_COL_BRAND=Marque
# DISWAY_COL_CATEGORY=Famille
# DISWAY_COL_DESCRIPTION=Description
```

## Déclencher l'import

Depuis le back-office admin (authentifié ADMIN) :

```
POST /api/admin/sync/disway
```

Pour importer explicitement le fichier déjà présent dans
`server/uploads/latest.xlsx`, sans connexion au portail :

```bash
npm run disway:import --workspace server
```

Cette commande appelle le même service que l'endpoint admin : parsing, marge
et corrections d'import restent ainsi identiques dans les deux cas.

Réponse :

```json
{ "imported": 120, "updated": 45, "failed": 3, "total": 168, "markup": 1.5 }
```

## Détection automatique des colonnes

Le service est flexible : il détecte automatiquement les colonnes du fichier
Excel en cherchant des mots-clés dans les en-têtes (insensible à la casse
et aux accents) :

| Champ       | Mots-clés reconnus                       |
| ----------- | ---------------------------------------- |
| Référence   | ref, reference, sku, code, article       |
| Nom produit | designation, nom, produit, libelle, name |
| Prix        | prix, tarif, cout, price, cost, ht       |
| Stock       | stock, quantite, dispo, quantity         |
| Marque      | marque, brand, fabriquant                |
| Catégorie   | categorie, category, famille             |
| Description | description, desc                        |

## Automatisation mensuelle

Pour une synchronisation automatique chaque mois, vous pouvez déclencher
l'endpoint via une tâche planifiée (cron) :

```bash
# Exécuter le 1er de chaque mois à 02h00
0 2 1 * * curl -X POST http://localhost:4000/api/admin/sync/disway \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN"
```
