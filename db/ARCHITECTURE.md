# Architecture données — TK Boards

> Cible d'architecture commerce. Schéma visuel : `db/schema.dbml` (coller dans
> [dbdiagram.io](https://dbdiagram.io)). Implémentation Drizzle réelle : `db/schema.ts`.
> Ce document = la **cible** discutée ; il peut être en avance sur le code en place.

---

## 1. Principe : deux mondes, une clé (le SKU)

| | Rôle | Contenu |
|---|---|---|
| **Sanity (CMS)** | le *contenu* | pages produit, navigation, **catégories**, pages catégorie, SEO, médias — et le **SKU** |
| **Neon (Postgres)** | le *commerce* | produits, variantes, attributs, prix, stock, options, produits liés, registre NFC, comptes |

- **Pas de maître** : les deux systèmes existent indépendamment, reliés par le **SKU**.
  Il n'y a (et ne peut y avoir) aucune FK entre eux → garde-fou applicatif, cf. §6.
- **La boutique interroge Neon UNIQUEMENT par SKU** (`getCommerceBySku(sku)`).
  La navigation et les catégories sont 100 % Sanity.
- **L'admin interroge Neon en direct** (liste tout, gère le commerce).

```
Boutique (Next.js)
   ├─→ Sanity : nav, menus, pages produit, pages catégorie   ← navigation + contenu
   └─→ Neon   : getCommerceBySku(sku)                         ← prix, variantes, stock, options, liés

Admin (Next.js)
   └─→ Neon en direct                                         ← CRUD commerce
```

---

## 2. Décisions structurantes (log)

1. **Base relationnelle (Postgres/Neon), pas MongoDB.** La donnée est profondément
   relationnelle et le métier repose sur l'intégrité (anti-vol : token/série uniques,
   transactions). Le petit volume (~30–60 planches/an) *renforce* ce choix : on optimise
   la robustesse, pas le débit.
2. **Tout ce qui est vendable = une `variant`.** Un produit *simple* (accessoire) a
   **une seule variante** (invisible côté client) ; un produit *configurable* (board) a
   **n variantes**. → prix/stock/panier/commande/NFC pointent **toujours** sur `variant`,
   zéro cas particulier. Côté admin, un produit simple n'affiche qu'un champ Prix + Stock.
3. **Attributs par produit** (pas globaux). Chaque produit définit ses propres axes
   (`product_attribute`) et valeurs (`product_attribute_value`). Ajouter un axe = de la
   donnée, jamais de migration.
4. **Prix par variante, devise unique EUR** (`variant.price_eur`). Promos triviales
   (cf. §5). Multi-devises = extension additive plus tard.
5. **Libellés i18n en `jsonb {fr,en,es}`** sur la ligne (valeurs, options). Le
   configurateur lit tout depuis Neon, une seule source.
6. **Catégories dans Sanity** (nav + pages). Neon garde seulement un `product.kind`
   léger (`board`/`accessory`) pour filtrer l'admin.
7. **Stock = quantité par variante** ; le **registre NFC (`unit`) est séparé** et
   sérialisé (anti-vol/garantie), pas un compteur de stock.

---

## 3. Concept produit : simple vs configurable

| Type | Sanity | Neon | Configurateur |
|---|---|---|---|
| **Simple** (jeu d'ailerons, leash) | page + SKU `TK-FIN-SET` | 1 `product`, **1 `variant`**, 0 attribut | non |
| **Configurable** (Rocket) | page + SKU parent `TK-RKT` | 1 `product`, **n `variant`** sur axes | oui |

> `kind` (board/accessory) et simple/configurable sont **deux dimensions distinctes** :
> un accessoire peut être configurable (leash en plusieurs tailles), une board peut être
> simple (taille unique).

---

## 4. Tables (référence)

### Catalogue
- **`product`** — le parent. `sku` (unique, = champ Sanity), `name` (admin), `kind`
  (filtre admin), `active`.
- **`product_attribute`** — les axes *de ce produit*. `code` (SIZE/COLOR),
  `name_i18n`, `input_type` (swatch/select), `sort_order`.
- **`product_attribute_value`** — les valeurs d'un axe. `code` (138/BLU),
  `label_i18n`, `swatch_hex` (couleurs), `sort_order`.
- **`variant`** — l'unité vendable. `sku` (unique enfant), `price_eur` (base),
  `sale_price_eur` (promo, nullable), `stock`, `active`.
- **`variant_value`** — jointure variante ↔ valeur choisie par axe.
  PK `(variant_id, attribute_id)` → une seule valeur par axe et par variante.
- **`product_option`** — add-ons payants génériques. `name_i18n`,
  `price_delta_eur` (+75), `sku`/`stock` optionnels.
- **`product_link`** — produits liés (achat conjoint / cross-sell / accessoire),
  typé et directionnel. Unique `(product_id, linked_product_id, type)`.

### Production / anti-vol
- **`unit`** — registre NFC sérialisé. `token` (unique, dans le tag), `variant_id`,
  `serial` (unique), `status`. Indépendant de `variant.stock`.

### Comptes / garantie (Auth.js + métier)
- **`user`** (table `user`) — Auth.js + champs métier (`role`, `first_name`,
  `last_name`, `phone`, `onboarded`, `locale`).
- **`account` / `session` / `verification_token`** — adapter Auth.js
  (`session` inutilisée en stratégie JWT, mais requise par l'adapter).
- **`registration`** — user ↔ unit (preuve d'achat, garantie, statut, contact public).
- **`claim`** — déclaration (vol/garantie) rattachée à une registration.
- **`address`** — adresses de livraison.

---

## 5. Conventions

- **SKU** : parent sur `product` (`TK-RKT`), enfant sur `variant`
  (`TK-RKT-BLU-138`). Pour un produit simple, l'enfant = le parent.
- **i18n** : `*_i18n` = `jsonb` `{ "fr": "...", "en": "...", "es": "..." }`.
- **Prix** : `price_eur` = prix de base (jamais perdu). `sale_price_eur` (nullable)
  = promo. **Prix affiché = `sale_price_eur ?? price_eur`** ; en promo ⇔
  `sale_price_eur IS NOT NULL` ; remise % = `(base − promo) / base` (dérivée).
- **Stock** : `variant.stock` = quantité vendable. `unit` = traçabilité physique.
- **Suppression produit** : cascade sur attributs/valeurs/variantes/options/liens ;
  `unit.variant_id` passe à NULL (l'unité physique survit à la variante).

---

## 6. Garde-fou SKU (puisque « pas de maître »)

Aucune FK possible entre Sanity et Neon. Prévoir une **vérif de cohérence**
(script ou page santé admin) qui liste :
- SKU présent dans Sanity sans `product` Neon correspondant ;
- `product` Neon sans page Sanity.

`product.sku` est `UNIQUE` côté Neon ; le champ SKU côté Sanity doit l'être aussi.

---

## 7. Extensions additives (plus tard — ne touchent pas le cœur)

Le stress-test a montré que ces évolutions sont **additives** (✅ donnée seule /
🟡 ajout) — jamais une refonte de `product/variant/attribute` :

| Besoin | Ajout |
|---|---|
| Commandes / panier | `order`, `order_item` (fige le prix payé à l'achat) |
| Promos programmées | `promotion` + `sale_starts_at/ends_at` sur `variant` |
| Packs vendus en 1 SKU | `bundle_item (bundle_variant_id, component_variant_id, qty)` |
| Multi-devises | `variant_price (variant_id, currency, amount)` |
| Stock multi-entrepôt | `variant_stock (variant_id, location_id, qty)` |
| Catégories multiples / tags | `product_category` (M2M) ou `tag` séparé |
| Promo programmée sur option | paire `sale_price` sur `product_option` |

Hors périmètre : abonnement / location.

---

## 8. Migration depuis l'existant (référence, à faire plus tard)

L'implémentation actuelle (`db/schema.ts`) utilise encore des noms `board_*` et des
colonnes size/color en dur. Correspondance vers la cible :

| Aujourd'hui | Cible |
|---|---|
| `model` | `product` (+ `kind`) |
| `board_variant` (size/color en colonnes) | `variant` + `product_attribute` + `product_attribute_value` + `variant_value` |
| `product_option` (model_id) | `product_option` (product_id, i18n) |
| `board_unit` | `unit` |
| `board_registration` | `registration` |
| `claim` / `address` / `user` … | inchangés |

> Migration non effectuée : c'est la cible validée, à implémenter quand on attaque
> le configurateur / la boutique.
