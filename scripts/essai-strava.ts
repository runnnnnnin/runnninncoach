// Essai de l'association activités Strava ↔ séances du plan : npx tsx scripts/essai-strava.ts
import { buildPlan } from "../src/lib/engine";
import { matchSessions, seal, unseal, type Activity } from "../src/lib/strava";

const plan = buildPlan({
  lang: "en", firstName: "Zoe", age: "25-34", goal: "10k", otherGoals: [], level: "occasionnel",
  availableDays: ["lun", "mer", "ven", "dim"], runsPerWeek: 3, strengthPerWeek: 1, maxMinutes: 60,
  otherSports: [], equipment: ["aucun"], injuries: [],
});
const week1 = plan.weeks[0].days.flatMap((d) => d.sessions.map((s) => `${d.day}:${s.kind}`));
console.log("Semaine 1 :", week1.join(", "));

const act = (id: number, date: string, sport_type: string, km = 6): Activity => ({ id, sport_type, start_date_local: `${date}T07:30:00Z`, distance: km * 1000, moving_time: km * 360 });
const start = "2026-11-16"; // lundi
const acts = [
  act(1, "2026-11-16", "Run"), // lundi : même jour
  act(2, "2026-11-16", "Ride"), // vélo : ignoré
  act(3, "2026-11-19", "Run"), // jeudi : la séance la plus proche (mer ou ven) à ±1 jour
  act(4, "2026-11-22", "WeightTraining"), // dimanche : renfo seulement s'il y en a une ce jour-là ou à ±1 jour
  act(5, "2026-11-30", "TrailRun"), // lundi de la semaine 3
];
const m = matchSessions(plan, start, acts);
console.log(m.map((x) => `${x.sessionId} <- activité ${x.activityId}`).join("\n"));
console.log("déjà utilisées ignorées :", matchSessions(plan, start, acts, new Set([1, 3, 5])).map((x) => x.activityId));
process.env.STRAVA_CLIENT_SECRET = "essai";
console.log("chiffrement aller-retour :", unseal(seal("jeton-secret")) === "jeton-secret");
