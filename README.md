# RunFlow

Le coach running + renfo qui connaît tous tes sports.

- `src/lib/engine.ts` : le moteur qui construit le plan (jours, durées, progression, sécurité).
- `src/lib/ai.ts` : Claude réécrit les textes du plan pour les personnaliser (jamais les charges).
- `src/app/` : les pages (accueil, questionnaire `/commencer`, plan `/plan`) et l'API `/api/plan`.
- `src/lib/brand.ts` : le nom et le slogan, à changer ici si la marque change.

Lancer en local : `npm install` puis `npm run dev`.
Tester le moteur : `npx tsx scripts/essai-moteur.ts`.
