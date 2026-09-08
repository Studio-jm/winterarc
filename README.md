# Winter Arc

Compagnon d'endurance personnel pour Jessy. UI française, sombre, saisie ~30 s.

V0 n'est **pas** un tracker d'habitudes. C'est une app **Next.js App Router + TypeScript + PWA** : imports (Apple Health / FIT / GPX), saisie quotidienne, repas, et un moteur de règles déterministe (`rules_version=0.1`) — **aucun LLM** sur le plan.

## Stack

- Next.js App Router, React 19, TypeScript
- PWA : `public/manifest.webmanifest` + `public/sw.js`
- SQLite fichier via `node:sqlite` en local
- Turso / `@libsql/client` en production si **les deux** `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN` sont définis
- Parsers : `saxes` (Health XML + GPX), `@garmin/fitsdk` (FIT)

## Développement

```bash
npm install
npm test
npm run build
npm run dev
```

Node ≥ 22.14 (nécessaire pour `node:sqlite`).

Copier `.env.example` vers `.env.local` si besoin. **Ne pas inventer** de credentials Turso. Sans les deux variables, l'app écrit `data/winterarc.db`.

## Produit V0

- **Aujourd'hui** : tuiles sommeil / RPE / douleur / repas + bannières de règles
- **Saisie** : RPE 1–10, sommeil prérempli 6,5 h, douleur 0–10 + zone, signaux cliniques. Une ligne par jour `Europe/Paris`, `source=manual`. N'écrase pas les imports.
- **Import** : `export.xml` Apple Health (SAX, workouts + sommeil, plafond ~32 Mo), FIT, GPX (trace capée à ~250 points). Bouton **Importer l'exemple**.
- **Repas** : texte libre + portion optionnelle → kcal high-end, `estimate=high` (heuristique, pas de LLM)
- **Règles 0.1** (~15 ko de catalogue) :
  - R1 protéger Campus Coach jusqu'au 2026-10-25
  - R5 démarche / lever / 24 h → `no_progression` (rouge)
  - R6 tibial focal / nuit / gonflement → `stop_run_human_review` (rouge uniquement)
  - R8 sommeil &lt; 7 h / plafond 6,5 h → `drop_optional_load` (bandeau calme, jamais rouge)
  - R7 deux alertes consécutives → `human_review`
  - R10 fièvre / poitrine → `no_training`
  - R11 mollets froids habituels sans boiterie → note, pas rouge
  - les autres : standing / stub avec trace

Hors scope V0 : Strava OAuth, HealthKit natif, LLM.

## Schéma

`activities`, `sleep_intervals`, `saisie`, `repas`, `flags`, `rule_evaluations`, `rule_actions`, `track_points`. Les imports ont `UNIQUE(source, import_key)`.
