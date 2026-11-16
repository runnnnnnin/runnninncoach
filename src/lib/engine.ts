/**
 * Moteur de plan RunFlow.
 *
 * Il fixe tout ce qui touche à la sécurité : volume, progression, jours, durées.
 * L'IA vient ensuite seulement réécrire les textes (voir ai.ts), jamais les charges.
 */
import {
  DAYS,
  DAY_LABELS,
  GOALS,
  INJURIES,
  type Day,
  type DayPlan,
  type Exercise,
  type Plan,
  type Profile,
  type Session,
  type Week,
} from "./types";

const WEEK_MULTIPLIERS = [1, 1.08, 1.16, 0.8];
const WEEK_LABELS = [
  { label: "Semaine 1", focus: "Prise de repères : on installe le rythme sans forcer." },
  { label: "Semaine 2", focus: "On construit : un peu plus de volume, toujours en contrôle." },
  { label: "Semaine 3", focus: "La semaine la plus chargée du bloc." },
  { label: "Semaine 4", focus: "Semaine allégée : ton corps assimile et devient plus fort." },
];

/** Minutes de course par séance en semaine 1, selon le niveau. */
const PER_RUN_BASE = { debutant: 22, occasionnel: 30, regulier: 38, confirme: 46 } as const;

const idx = (d: Day) => DAYS.indexOf(d);
const dayAt = (i: number) => DAYS[((i % 7) + 7) % 7];
const dist = (a: Day, b: Day) => {
  const x = Math.abs(idx(a) - idx(b));
  return Math.min(x, 7 - x);
};
const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

type RunSlot = { day: Day; kind: "longue" | "qualite" | "facile" };

function fatigueMap(p: Profile) {
  const f: Record<Day, number> = { lun: 0, mar: 0, mer: 0, jeu: 0, ven: 0, sam: 0, dim: 0 };
  for (const s of p.otherSports) {
    const v = s.intensity === "intense" ? 2 : s.intensity === "modere" ? 1 : 0;
    f[s.day] = Math.max(f[s.day], v);
  }
  return f;
}

function pickBest(cands: Day[], score: (d: Day) => number): Day | undefined {
  let best: Day | undefined;
  let bestScore = -Infinity;
  for (const d of cands) {
    const s = score(d);
    if (s > bestScore) {
      best = d;
      bestScore = s;
    }
  }
  return best;
}

export function scheduleWeek(p: Profile) {
  const fat = fatigueMap(p);
  const prev = (d: Day) => fat[dayAt(idx(d) - 1)];
  const next = (d: Day) => fat[dayAt(idx(d) + 1)];
  const available = DAYS.filter((d) => p.availableDays.includes(d));
  const runs = Math.min(p.runsPerWeek, available.length);

  let qualityN = 0;
  if (p.level === "occasionnel" && runs >= 3) qualityN = 1;
  if (p.level === "regulier") qualityN = 1;
  if (p.level === "confirme") qualityN = runs >= 4 ? 2 : 1;
  if (p.goal === "forme" || p.goal === "5k") qualityN = Math.min(qualityN, 1);
  qualityN = Math.min(qualityN, runs - 1);

  const slots: RunSlot[] = [];
  const used = new Set<Day>();
  const free = () => available.filter((d) => !used.has(d));

  // 1. Sortie longue : de préférence le week-end, loin des sports intenses.
  const long = pickBest(free(), (d) => {
    let s = d === "dim" ? 3 : d === "sam" ? 2.5 : 0;
    if (fat[d] >= 2) s -= 6;
    else if (fat[d] === 1) s -= 3;
    if (prev(d) >= 2) s -= 3;
    return s;
  })!;
  slots.push({ day: long, kind: "longue" });
  used.add(long);

  // 2. Séances de qualité : jamais le jour ou le lendemain d'un sport intense.
  for (let q = 0; q < qualityN; q++) {
    const d = pickBest(free(), (d) => {
      let s = 0;
      for (const sl of slots) {
        const gap = dist(d, sl.day);
        s += gap < 2 ? -8 : Math.min(gap, 3);
      }
      if (fat[d] >= 2) s -= 8;
      else if (fat[d] === 1) s -= 2;
      if (prev(d) >= 2) s -= 5;
      if (next(d) >= 2) s -= 1;
      return s;
    });
    if (!d) break;
    slots.push({ day: d, kind: "qualite" });
    used.add(d);
  }

  // 3. Footings faciles : on étale, on évite d'empiler sur les jours déjà chargés.
  while (slots.length < runs) {
    const d = pickBest(free(), (d) => {
      let s = 0;
      for (const sl of slots) if (dist(d, sl.day) === 1) s -= p.level === "debutant" ? 4 : 1.5;
      if (fat[d] >= 2) s -= 3;
      else if (fat[d] === 1) s -= 1;
      return s;
    });
    if (!d) break;
    slots.push({ day: d, kind: "facile" });
    used.add(d);
  }

  // 4. Renfo : jours sans course si possible, jamais la veille d'une séance clé.
  const keyDays = slots.filter((s) => s.kind !== "facile").map((s) => s.day);
  const strengthDays: Day[] = [];
  for (let i = 0; i < Math.min(p.strengthPerWeek, available.length); i++) {
    const d = pickBest(
      available.filter((d) => !strengthDays.includes(d)),
      (d) => {
        const slot = slots.find((s) => s.day === d);
        let s = !slot ? 3 : slot.kind === "facile" ? 1 : -4;
        if (keyDays.some((k) => idx(k) === (idx(d) + 1) % 7)) s -= 3;
        if (fat[d] >= 2) s -= 3;
        for (const sd of strengthDays) if (dist(d, sd) <= 1) s -= 2;
        return s;
      },
    );
    if (d) strengthDays.push(d);
  }

  return { slots, strengthDays, runs, fat };
}

/* ---------- Contenu des séances ---------- */

const EFFORT = {
  facile: "Facile, 4/10 : tu peux parler en courant",
  qualite: "Soutenu, 7-8/10 sur les parties rapides",
  longue: "Très facile, 3-4/10 : le secret, c'est la patience",
  "marche-course": "Facile : la course doit rester confortable",
  renfo: "Contrôlé : technique avant la charge",
} as const;

function walkRun(minutes: number, w: number): Pick<Session, "description" | "steps"> {
  const [run, walk] = [
    [1, 1.5],
    [2, 1],
    [3, 1],
    [2, 1],
  ][w];
  const reps = Math.max(4, Math.floor((minutes - 10) / (run + walk)));
  return {
    description:
      "Alterner course très lente et marche : c'est la méthode la plus sûre pour construire ton endurance sans te blesser.",
    steps: [
      "5 min de marche active pour s'échauffer",
      `${reps} × (${run} min de course lente + ${String(walk).replace(".", ",")} min de marche)`,
      "5 min de marche, puis étirements doux",
    ],
  };
}

function qualityContent(p: Profile, minutes: number, w: number, second: boolean) {
  const warm = minutes >= 45 ? 15 : 10;
  const cool = minutes >= 45 ? 10 : 5;
  const easyLevel = p.level === "occasionnel";
  let title = "Fractionné";
  let main: string;
  let description: string;

  const family = second
    ? p.goal === "semi" || p.goal === "marathon"
      ? "vma"
      : p.goal === "trail"
        ? "seuil"
        : "seuil"
    : p.goal === "trail"
      ? "cotes"
      : p.goal === "semi" || p.goal === "marathon"
        ? "seuil"
        : p.goal === "forme" || easyLevel
          ? "fartlek"
          : "vma";

  if (family === "fartlek") {
    title = "Fartlek";
    main = ["6 × (1 min dynamique + 2 min facile)", "8 × (1 min dynamique + 1 min 30 facile)", "6 × (1 min 30 dynamique + 1 min 30 facile)", "6 × 20 s d'accélération progressive, récup libre"][w];
    description = "Jouer avec l'allure : des passages plus rapides, sans jamais être à fond.";
  } else if (family === "vma") {
    title = "Fractionné court";
    main = ["8 × (30 s rapide + 30 s trot)", "10 × (30 s rapide + 30 s trot)", "6 × (1 min rapide + 1 min trot)", "6 × (30 s rapide + 30 s trot)"][w];
    description = "Développer ta vitesse : rapide mais régulier, la dernière répétition doit ressembler à la première.";
  } else if (family === "seuil") {
    title = "Allure seuil";
    main = ["3 × 6 min à allure soutenue, 2 min de trot entre", "3 × 8 min à allure soutenue, 2 min de trot entre", "2 × 12 min à allure soutenue, 3 min de trot entre", "4 × 3 min à allure soutenue, 1 min 30 de trot entre"][w];
    description = "« Confortablement difficile » : tu peux dire quelques mots, pas une phrase entière.";
  } else {
    title = "Côtes";
    main = ["8 × 30 s en montée, retour en marchant", "10 × 30 s en montée, retour en marchant", "6 × 1 min en montée, retour en marchant", "Parcours vallonné libre, marche dans les pentes raides"][w];
    description = "Renforcer jambes et foulée pour le trail : pousse sur l'avant du pied, buste droit.";
  }

  return {
    title,
    description,
    steps: [`${warm} min de footing facile + 3 accélérations progressives`, main, `${cool} min de retour au calme en trottinant`],
  };
}

function longContent(p: Profile, w: number) {
  if (p.goal === "trail")
    return {
      title: "Sortie longue nature",
      description: "Sur chemins si possible. Marcher dans les montées raides fait partie du trail : ce n'est pas tricher.",
    };
  if (p.goal === "marathon" && w === 2 && p.level !== "debutant")
    return {
      title: "Sortie longue",
      description: "Tout en aisance, avec les 15 dernières minutes à ton allure marathon visée.",
    };
  return {
    title: "Sortie longue",
    description: "Allure très lente : si tu es essoufflé, ralentis. C'est elle qui construit ton endurance.",
  };
}

function strengthExercises(p: Profile, w: number): Exercise[] {
  const sets = w === 2 ? 3 : 2;
  const inj = new Set(p.injuries);
  const heavy = p.equipment === "halteres" || p.equipment === "salle";
  const list: Exercise[] = [];

  // Bas du corps
  if (p.equipment === "salle") list.push({ name: "Presse à cuisses", dose: `${sets} × 10` });
  else if (p.equipment === "halteres") list.push({ name: "Goblet squat (haltère contre la poitrine)", dose: `${sets} × 10` });
  else list.push({ name: "Squat au poids du corps", dose: `${sets} × ${12 + w * 2}`, cue: "Genoux dans l'axe des pieds" });

  if (inj.has("genou")) {
    list.push({ name: "Step-down lent sur une marche", dose: `${sets} × 8 / jambe`, cue: "Descends en 3 secondes, genou au-dessus du pied" });
    list.push({ name: "Chaise contre le mur", dose: `${sets} × 30 s` });
  } else {
    list.push({ name: heavy ? "Fente arrière avec haltères" : "Fente arrière alternée", dose: `${sets} × 8 / jambe` });
  }

  // Chaîne arrière
  if (heavy && !inj.has("dos")) list.push({ name: "Soulevé de terre jambes tendues", dose: `${sets} × 10`, cue: "Dos plat, hanches vers l'arrière" });
  else list.push({ name: "Pont fessier sur une jambe", dose: `${sets} × 10 / jambe` });

  // Mollets / pieds
  if (inj.has("achille")) list.push({ name: "Mollets excentriques sur une marche", dose: `${sets} × 12`, cue: "Monte sur deux pieds, redescends sur un seul en 3 s" });
  else list.push({ name: "Montées sur pointes de pieds", dose: `${sets} × 15` });

  if (inj.has("cheville")) list.push({ name: "Équilibre sur un pied (yeux fermés si trop facile)", dose: `${sets} × 30 s / pied` });
  if (inj.has("hanche") || p.equipment === "elastiques")
    list.push({ name: p.equipment === "elastiques" ? "Marche latérale avec élastique" : "Abduction de hanche couché sur le côté", dose: `${sets} × 12 / côté` });

  // Gainage
  list.push({ name: "Gainage planche", dose: `${sets} × ${30 + w * 5} s` });
  list.push(inj.has("dos") ? { name: "Dead bug", dose: `${sets} × 8 / côté`, cue: "Bas du dos collé au sol" } : { name: "Gainage latéral", dose: `${sets} × 20 s / côté` });

  // Haut du corps (posture et bras)
  if (p.equipment === "salle") list.push({ name: "Tirage horizontal", dose: `${sets} × 10` });
  else if (p.equipment === "elastiques") list.push({ name: "Tirage élastique (dos)", dose: `${sets} × 12` });
  else list.push({ name: "Bird-dog", dose: `${sets} × 8 / côté` });

  return list;
}

/* ---------- Assemblage ---------- */

export function buildPlan(p: Profile): Plan {
  const { slots, strengthDays, runs, fat } = scheduleWeek(p);
  const warnings: string[] = [];

  let base = PER_RUN_BASE[p.level] * runs;
  if ((p.goal === "semi" || p.goal === "marathon") && (p.level === "regulier" || p.level === "confirme")) base *= 1.1;
  if (p.goal === "forme") base *= 0.9;
  if (p.injuries.length) base *= 0.9;
  if (p.age === "55+") base *= 0.9;
  const intenseOther = p.otherSports.filter((s) => s.intensity === "intense").reduce((a, s) => a + s.minutes, 0);
  if (intenseOther >= 180) base *= 0.9;
  const multipliers = p.injuries.length ? [1, 1.05, 1.1, 0.8] : WEEK_MULTIPLIERS;

  const longWeight = p.level === "debutant" ? 1.3 : p.goal === "semi" || p.goal === "marathon" || p.goal === "trail" ? 1.7 : 1.4;
  const weights = slots.map((s) => (s.kind === "longue" ? longWeight : s.kind === "qualite" ? 1.1 : 1));
  const wSum = weights.reduce((a, b) => a + b, 0);

  const weeks: Week[] = multipliers.map((m, w) => {
    const total = base * m;
    const days: DayPlan[] = DAYS.map((d) => ({
      day: d,
      sessions: [],
      otherSports: p.otherSports.filter((s) => s.day === d),
    }));
    const dayPlan = (d: Day) => days[idx(d)];
    let runMinutes = 0;
    let qualityCount = 0;

    slots.forEach((slot, i) => {
      // Une séance de qualité a besoin de place pour l'échauffement et le retour au calme.
      const floor = slot.kind === "qualite" && p.level !== "debutant" ? Math.min(40, p.maxMinutes) : 20;
      const minutes = round5(clamp((total * weights[i]) / wSum, floor, p.maxMinutes));
      runMinutes += minutes;
      const id = `s${w + 1}-${slot.day}-${slot.kind}`;
      let s: Session;
      if (p.level === "debutant") {
        s = {
          id,
          kind: "marche-course",
          title: slot.kind === "longue" ? "Marche-course longue" : "Marche-course",
          minutes,
          effort: EFFORT["marche-course"],
          ...walkRun(minutes, w),
        };
      } else if (slot.kind === "qualite") {
        s = { id, kind: "qualite", minutes, effort: EFFORT.qualite, ...qualityContent(p, minutes, w, qualityCount++ > 0) };
      } else if (slot.kind === "longue") {
        s = { id, kind: "longue", minutes, effort: EFFORT.longue, ...longContent(p, w) };
      } else {
        s = {
          id,
          kind: "facile",
          title: "Footing facile",
          minutes,
          effort: EFFORT.facile,
          description:
            p.level === "occasionnel"
              ? "En aisance totale. Une pause marche de 1 min si besoin, aucun souci."
              : "En endurance fondamentale : allure de conversation, on finit frais.",
        };
      }
      const prevDay = dayAt(idx(slot.day) - 1);
      const prevSport = p.otherSports.find((o) => o.day === prevDay && o.intensity === "intense");
      const sameSport = p.otherSports.find((o) => o.day === slot.day && o.intensity !== "leger");
      if (prevSport) s.coachNote = `Lendemain de ${prevSport.sport.toLowerCase()} : garde cette séance très tranquille, c'est aussi de la récupération.`;
      else if (sameSport) s.coachNote = `Tu as aussi ${sameSport.sport.toLowerCase()} ce jour-là : fais la course à une autre heure et reste vraiment facile.`;
      dayPlan(slot.day).sessions.push(s);
    });

    for (const d of strengthDays) {
      const minutes = round5(clamp(25 + w * 5 - (w === 3 ? 10 : 0), 20, Math.min(40, p.maxMinutes)));
      dayPlan(d).sessions.push({
        id: `s${w + 1}-${d}-renfo`,
        kind: "renfo",
        title: "Renfo du coureur",
        minutes,
        effort: EFFORT.renfo,
        description: "Muscler ce qui protège tes articulations et rend ta foulée plus efficace. 1 min de récup entre les séries.",
        exercises: strengthExercises(p, w),
        coachNote: (() => {
          const o = p.otherSports.find((x) => x.day === d && x.intensity !== "leger");
          return o
            ? `Tu as aussi ${o.sport.toLowerCase()} ce jour-là : fais le renfo à un autre moment de la journée, ou seulement la moitié des séries.`
            : undefined;
        })(),
      });
    }

    return { index: w + 1, ...WEEK_LABELS[w], runMinutes, days };
  });

  if (p.runsPerWeek > runs)
    warnings.push(`Tu voulais ${p.runsPerWeek} sorties mais tu n'as que ${runs} jours disponibles : le plan en prévoit ${runs}.`);
  if (p.injuries.length)
    warnings.push(
      `Tu as signalé une fragilité (${p.injuries.map((i) => INJURIES[i].toLowerCase()).join(", ")}) : la progression est plus douce et le renfo est adapté. Une douleur qui revient = on arrête et on consulte.`,
    );
  if (p.level === "debutant" || p.age === "55+" || p.age === "45-54")
    warnings.push("Si tu reprends le sport après une longue pause, un rapide check-up chez ton médecin est une bonne idée.");
  const hardDays = DAYS.filter((d) => fat[d] >= 2);
  if (hardDays.length)
    warnings.push(
      `Tes jours de sport intense (${hardDays.map((d) => DAY_LABELS[d].toLowerCase()).join(", ")}) sont pris en compte : pas de séance dure ces jours-là ni le lendemain quand c'est possible.`,
    );

  return {
    firstName: p.firstName,
    goalLabel: GOALS[p.goal],
    intro: `${p.firstName}, voici ton premier bloc de 4 semaines. Il est construit autour de ta vraie semaine, tes autres sports compris : la régularité compte plus que l'intensité.`,
    tips: [
      "La plupart de tes sorties doivent être faciles : c'est ce qui fait progresser sans se blesser.",
      "Une séance ratée ? Ne la rattrape pas, reprends simplement le plan le lendemain.",
      "Dors, hydrate-toi et mange assez : c'est pendant la récupération que tu deviens plus fort.",
    ],
    warnings: [...warnings, "Ce plan ne remplace pas un avis médical. Écoute ton corps."],
    weeks,
    personalizedByAI: false,
    createdAt: new Date().toISOString(),
  };
}
