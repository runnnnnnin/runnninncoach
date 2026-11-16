import { buildPlan } from "../src/lib/engine";
import type { Profile } from "../src/lib/types";
const profiles: Profile[] = [
  { lang: "fr", firstName: "Léa", age: "25-34", goal: "10k", level: "regulier", availableDays: ["lun","mer","jeu","sam","dim"], runsPerWeek: 3, strengthPerWeek: 2, maxMinutes: 75,
    otherSports: [{ sport: "football", day: "mar", intensity: "intense", minutes: 90 }, { sport: "padel", day: "sam", intensity: "modere", minutes: 90 }], equipment: "aucun", injuries: ["genou"] },
  { lang: "en", firstName: "Tom", age: "45-54", goal: "5k", level: "debutant", availableDays: ["mar","jeu","sam"], runsPerWeek: 4, strengthPerWeek: 1, maxMinutes: 45, otherSports: [], equipment: "elastiques", injuries: [] },
  { lang: "en", firstName: "Max", age: "35-44", goal: "marathon", level: "confirme", availableDays: ["lun","mar","mer","jeu","ven","sam","dim"], runsPerWeek: 5, strengthPerWeek: 2, maxMinutes: 120,
    otherSports: [{ sport: "velo", day: "mer", intensity: "intense", minutes: 120 }], equipment: "salle", injuries: ["achille"] },
];
for (const p of profiles) {
  const plan = buildPlan(p);
  console.log(`\n=== ${p.firstName} (${p.level}, ${p.goal})`);
  for (const w of plan.weeks) {
    console.log(`${w.label} — ${w.runMinutes} min de course`);
    for (const d of w.days) {
      const s = d.sessions.map((s) => `${s.title} ${s.minutes}′`).join(" + ");
      const o = d.otherSports.map((o) => `[${o.sport} ${o.intensity}]`).join(" ");
      if (s || o) console.log(`  ${d.day}: ${s} ${o}`);
    }
  }
  console.log("Alertes:", plan.warnings);
}
const w1 = buildPlan(profiles[0]).weeks[0].days.find(d=>d.sessions.some(s=>s.kind==="qualite"))!;
console.log(JSON.stringify(w1.sessions, null, 1));
