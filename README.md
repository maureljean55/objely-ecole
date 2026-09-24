# Objely École

Borne tactile d'objets perdus et trouvés pour les lycées et universités.
Conçue pour un iPad 11" en paysage (1194×834), mise à l'échelle sur tout écran.

## Démarrer

```bash
cp .env.example .env.local   # renseigner les clés du projet Supabase objely-ecole
npm install
npm run dev
```

## Parcours

`/` accueil → `/declarer/[perdu|trouve]/informations` → `/objet` → `/photos` → `/confirmation`,
plus `/assistance` et `/rechercher`.

## À savoir

- **Design** : Inter, tokens dans `src/app/globals.css`, icônes Material Symbols auto-hébergées
  (aucun appel à Google depuis la borne). Après avoir ajouté une icône : `node scripts/build-icon-font.mjs`.
- **Inactivité** : après 90 s sans toucher l'écran, la saisie est effacée et la borne revient à l'accueil (`src/lib/kiosk.ts`).
- **Pas encore branché** : l'enregistrement de la déclaration (`src/lib/submit.ts`), la page smartphone
  `/depot/[session]` derrière le QR code et la recherche d'objets. Ils attendent le schéma Supabase.

## Base de données

Le schéma partagé par la borne et l'espace d'administration est dans
`supabase/migrations/20260924100000_school_schema.sql`, appliqué sur le projet Supabase `objely-ecole`
(`jmmqgvtucavtvxwukgpw`) avec `supabase db push --linked`.

- Un établissement = une `organization`. Toutes les tables portent `organization_id` et sont protégées par RLS.
- La borne n'accède **jamais** aux tables : uniquement aux fonctions `pair_kiosk`, `kiosk_config`,
  `kiosk_submit_declaration` et `kiosk_list_objects`, avec un jeton propre à chaque borne (stocké haché).
- Un objet ne passe à « rendu » que par `restitute_object()`, qui exige la vérification d'identité.
- Créer un établissement et son premier administrateur : `select public.bootstrap_organization('Lycée …', 'lycee', 'admin@…', 'Nom Prénom')`
  (clé service uniquement). Il rattache ensuite son compte à son e-mail via `claim_membership()`.
