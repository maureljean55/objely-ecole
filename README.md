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
