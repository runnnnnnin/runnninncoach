/**
 * Moteur de plan RunFlow.
 *
 * Il fixe tout ce qui touche à la sécurité : volume, progression, jours, durées.
 * L'IA vient ensuite seulement réécrire les textes (voir ai.ts), jamais les charges.
 */
import { ENGINE_TEXT, type EngineText } from "./engine-text";
import { LABELS, sportLabel } from "./labels";
import { DAYS, LEVEL_KEYS as LEVEL_KEYS_ORDER, type Day, type DayPlan, type Exercise, type Plan, type Profile, type Session, type Week } from "./types";

const WEEK_MULTIPLIERS = [1, 1.08, 1.16, 0.8];

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

function walkRun(t: EngineText, minutes: number, w: number): Pick<Session, "description" | "steps"> {
  const [run, walk] = [
    [1, 1.5],
    [2, 1],
    [3, 1],
    [2, 1],
  ][w];
  const reps = Math.max(4, Math.floor((minutes - 10) / (run + walk)));
  return { description: t.walkRun.description, steps: [t.walkRun.warm, t.walkRun.main(reps, run, walk), t.walkRun.cool] };
}

function qualityContent(t: EngineText, p: Profile, minutes: number, w: number, second: boolean) {
  const warm = minutes >= 45 ? 15 : 10;
  const cool = minutes >= 45 ? 10 : 5;
  const family = second
    ? p.goal === "semi" || p.goal === "marathon"
      ? "vma"
      : "seuil"
    : p.goal === "trail"
      ? "cotes"
      : p.goal === "semi" || p.goal === "marathon"
        ? "seuil"
        : p.goal === "forme" || p.level === "occasionnel"
          ? "fartlek"
          : "vma";
  const q = t.quality[family];
  return { title: q.title, description: q.description, steps: [t.warmup(warm), q.main[w], t.cooldown(cool)] };
}

function longContent(t: EngineText, p: Profile, w: number) {
  if (p.goal === "trail") return { title: t.long.trailTitle, description: t.long.trail };
  if (p.goal === "marathon" && w === 2 && p.level !== "debutant") return { title: t.long.title, description: t.long.marathonW3 };
  return { title: t.long.title, description: t.long.default };
}

function strengthExercises(t: EngineText, p: Profile, w: number): Exercise[] {
  const sets = w === 2 ? 3 : 2;
  const inj = new Set(p.injuries);
  const has = (e: Profile["equipment"][number]) => p.equipment.includes(e);
  const heavy = has("halteres") || has("salle");
  const list: Exercise[] = [];
  const ex = (key: string, dose: string, cue?: string): Exercise => ({ name: t.ex[key], dose, ...(cue ? { cue: t.cue[cue] } : {}) });

  if (has("salle")) list.push(ex("legPress", `${sets} × 10`));
  else if (has("halteres")) list.push(ex("goblet", `${sets} × 10`));
  else list.push(ex("squat", `${sets} × ${12 + w * 2}`, "squat"));

  if (inj.has("genou")) {
    list.push(ex("stepDown", `${sets} × 8 ${t.perLeg}`, "stepDown"));
    list.push(ex("wallSit", `${sets} × 30 s`));
  } else {
    list.push(ex(heavy ? "lungeDb" : "lunge", `${sets} × 8 ${t.perLeg}`));
  }

  if (heavy && !inj.has("dos")) list.push(ex("rdl", `${sets} × 10`, "rdl"));
  else list.push(ex("bridge", `${sets} × 10 ${t.perLeg}`));

  if (inj.has("achille")) list.push(ex("eccentricCalf", `${sets} × 12`, "eccentricCalf"));
  else list.push(ex("calf", `${sets} × 15`));

  if (inj.has("cheville")) list.push(ex("balance", `${sets} × 30 s ${t.perFoot}`));
  if (inj.has("hanche") || has("elastiques"))
    list.push(ex(has("elastiques") ? "bandWalk" : "abduction", `${sets} × 12 ${t.perSide}`));

  list.push(ex("plank", `${sets} × ${30 + w * 5} s`));
  list.push(inj.has("dos") ? ex("deadBug", `${sets} × 8 ${t.perSide}`, "deadBug") : ex("sidePlank", `${sets} × 20 s ${t.perSide}`));

  if (has("salle")) list.push(ex("row", `${sets} × 10`));
  else if (has("elastiques")) list.push(ex("bandRow", `${sets} × 12`));
  else list.push(ex("birdDog", `${sets} × 8 ${t.perSide}`));

  return list;
}

/* ---------- Longueur du plan ---------- */

/** Semaines visibles dans le plan gratuit. */
export const FREE_WEEKS = 2;
/** Plan complet : au plus 16 semaines (jusqu'à la course), 8 semaines sans date de course. */
export const MAX_WEEKS = 16;
export const DEFAULT_FULL_WEEKS = 8;

type WeekSpec = { ci: 0 | 1 | 2 | 3; block: number; phase: "build" | "taper" | "race" };

const DAY_MS = 86_400_000;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const mondayOf = (d: Date) => new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY_MS);

/** Durée de course estimée (minutes) selon l'objectif et le niveau, pour la séance « jour de course ». */
const RACE_MIN: Record<string, [number, number, number, number]> = {
  "5k": [40, 33, 28, 23],
  "10k": [75, 65, 55, 47],
  chrono: [75, 65, 55, 47],
  semi: [165, 140, 120, 100],
  marathon: [330, 285, 245, 210],
  trail: [200, 180, 160, 140],
};

/** Lundi de départ, nombre de semaines du plan complet et jour de la course (si date de course). */
export function planFrame(p: Profile, today = new Date()): { weeks: number; start: string | null; raceDay: Day | null } {
  const day0 = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start0 = day0.getUTCDay() === 1 ? day0 : new Date(mondayOf(day0).getTime() + 7 * DAY_MS);
  if (!p.raceDate || p.goal === "forme") return { weeks: DEFAULT_FULL_WEEKS, start: null, raceDay: null };
  const race = new Date(`${p.raceDate}T00:00:00Z`);
  if (Number.isNaN(race.getTime())) return { weeks: DEFAULT_FULL_WEEKS, start: null, raceDay: null };
  const raceMonday = mondayOf(race);
  let n = Math.round((raceMonday.getTime() - start0.getTime()) / (7 * DAY_MS)) + 1;
  let start = start0;
  // Course trop proche (cette semaine) : plan normal sans semaine de course.
  if (n < 1) return { weeks: DEFAULT_FULL_WEEKS, start: null, raceDay: null };
  // Course lointaine : le plan démarre 16 semaines avant.
  if (n > MAX_WEEKS) {
    n = MAX_WEEKS;
    start = new Date(raceMonday.getTime() - (MAX_WEEKS - 1) * 7 * DAY_MS);
  }
  return { weeks: n, start: isoDate(start), raceDay: DAYS[(race.getUTCDay() + 6) % 7] };
}

/** Blocs de 3 semaines qui montent + 1 semaine allégée ; avant une course : affûtage puis semaine de course. */
function weekSpecs(n: number, race: boolean): WeekSpec[] {
  const build = race ? Math.max(0, n - 2) : n;
  const specs: WeekSpec[] = [];
  for (let i = 0; i < build; i++) {
    let ci = (i % 4) as WeekSpec["ci"];
    if (race && i === build - 1 && ci === 3) ci = 2; // pas deux semaines légères d'affilée avant l'affûtage
    specs.push({ ci, block: Math.floor(i / 4), phase: "build" });
  }
  if (race) {
    if (n >= 2) specs.push({ ci: 3, block: Math.floor(Math.max(0, build - 1) / 4), phase: "taper" });
    specs.push({ ci: 3, block: 0, phase: "race" });
  }
  return specs;
}

/* ---------- Assemblage ---------- */

/**
 * full = false : seules les FREE_WEEKS premières semaines sont données (plan gratuit),
 * mais le plan est construit en entier pour que ce soit bien le début du plan complet.
 */
export function buildPlan(p: Profile, opts: { full?: boolean; today?: Date } = {}): Plan {
  const full = opts.full ?? true;
  const lang = p.lang ?? "en";
  const t = ENGINE_TEXT[lang];
  const L = LABELS[lang];
  const sport = (s: string) => sportLabel(lang, s);
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
  const frame = planFrame(p, opts.today);
  const specs = weekSpecs(frame.weeks, Boolean(frame.raceDay));
  const growth = (block: number) => 1 + 0.07 * Math.min(block, 3);
  const volume = (sp: WeekSpec) =>
    sp.phase === "race" ? 0.5 : sp.phase === "taper" ? 0.75 * growth(sp.block) : multipliers[sp.ci] * growth(sp.block);
  const raceDay = frame.raceDay;
  const eveOfRace = raceDay ? dayAt(idx(raceDay) - 1) : null;

  const longWeight = p.level === "debutant" ? 1.3 : p.goal === "semi" || p.goal === "marathon" || p.goal === "trail" ? 1.7 : 1.4;
  const weights = slots.map((s) => (s.kind === "longue" ? longWeight : s.kind === "qualite" ? 1.1 : 1));
  const wSum = weights.reduce((a, b) => a + b, 0);

  const weeks: Week[] = specs.map((sp, w) => {
    const total = base * volume(sp);
    const ci = sp.ci;
    const raceWeek = sp.phase === "race" && raceDay !== null;
    const days: DayPlan[] = DAYS.map((d) => ({
      day: d,
      sessions: [],
      otherSports: p.otherSports.filter((s) => s.day === d),
    }));
    const dayPlan = (d: Day) => days[idx(d)];
    let runMinutes = 0;
    let qualityCount = 0;

    slots.forEach((orig, i) => {
      // Semaine de course : rien la veille ni le jour J, la sortie longue devient un footing,
      // et la séance de qualité ne reste que si elle tombe au moins 2 jours avant.
      if (raceWeek && (orig.day === raceDay || orig.day === eveOfRace)) return;
      const slot: RunSlot =
        raceWeek && (orig.kind === "longue" || (orig.kind === "qualite" && (idx(raceDay!) - idx(orig.day) + 7) % 7 < 2))
          ? { ...orig, kind: "facile" }
          : orig;
      // Une séance de qualité a besoin de place pour l'échauffement et le retour au calme.
      const floor = slot.kind === "qualite" && p.level !== "debutant" ? Math.min(40, p.maxMinutes) : 20;
      const minutes = round5(clamp((total * weights[i]) / wSum, floor, p.maxMinutes));
      runMinutes += minutes;
      const id = `s${w + 1}-${slot.day}-${orig.kind}`;
      let s: Session;
      if (p.level === "debutant") {
        s = {
          id,
          kind: "marche-course",
          title: slot.kind === "longue" ? t.walkRun.titleLong : t.walkRun.title,
          minutes,
          effort: t.effort["marche-course"],
          ...walkRun(t, minutes, ci),
        };
      } else if (slot.kind === "qualite") {
        s = { id, kind: "qualite", minutes, effort: t.effort.qualite, ...qualityContent(t, p, minutes, ci, qualityCount++ > 0) };
      } else if (slot.kind === "longue") {
        s = { id, kind: "longue", minutes, effort: t.effort.longue, ...longContent(t, p, ci) };
      } else {
        s = {
          id,
          kind: "facile",
          title: t.easy.title,
          minutes,
          effort: t.effort.facile,
          description: p.level === "occasionnel" ? t.easy.occasional : t.easy.default,
        };
      }
      const prevDay = dayAt(idx(slot.day) - 1);
      const prevSport = p.otherSports.find((o) => o.day === prevDay && o.intensity === "intense");
      const sameSport = p.otherSports.find((o) => o.day === slot.day && o.intensity !== "leger");
      if (prevSport) s.coachNote = t.noteAfter(sport(prevSport.sport));
      else if (sameSport) s.coachNote = t.noteSameDayRun(sport(sameSport.sport));
      dayPlan(slot.day).sessions.push(s);
    });

    if (raceWeek) {
      const minutes = RACE_MIN[p.goal]?.[LEVEL_KEYS_ORDER.indexOf(p.level)] ?? 60;
      dayPlan(raceDay!).sessions.push({
        id: `s${w + 1}-${raceDay}-race`,
        kind: "longue",
        title: t.race.title,
        minutes,
        effort: t.effort.qualite,
        description: t.race.description,
      });
    }

    for (const d of raceWeek ? [] : strengthDays) {
      const minutes = round5(clamp(25 + ci * 5 - (ci === 3 ? 10 : 0), 20, Math.min(40, p.maxMinutes)));
      const o = p.otherSports.find((x) => x.day === d && x.intensity !== "leger");
      dayPlan(d).sessions.push({
        id: `s${w + 1}-${d}-renfo`,
        kind: "renfo",
        title: t.strength.title,
        minutes,
        effort: t.effort.renfo,
        description: t.strength.description,
        exercises: strengthExercises(t, p, ci),
        coachNote: o ? t.noteSameDayStrength(sport(o.sport)) : undefined,
      });
    }

    const focus = sp.phase === "race" ? t.focusRace : sp.phase === "taper" ? t.focusTaper : t.weeks[ci].focus;
    return { index: w + 1, label: t.weekLabel(w + 1), focus, runMinutes, days };
  });

  if (p.runsPerWeek > runs) warnings.push(t.warnFewDays(p.runsPerWeek, runs));
  if (p.injuries.length) warnings.push(t.warnInjury(p.injuries.map((i) => L.injuries[i].toLowerCase()).join(", ")));
  if (p.level === "debutant" || p.age === "55+" || p.age === "45-54") warnings.push(t.warnCheckup);
  const hardDays = DAYS.filter((d) => fat[d] >= 2);
  if (hardDays.length) warnings.push(t.warnHardDays(hardDays.map((d) => (lang === "fr" ? L.days[d].toLowerCase() : L.days[d])).join(", ")));

  return {
    lang,
    firstName: p.firstName,
    goalLabel: [p.goal, ...(p.otherGoals ?? []).filter((g) => g !== p.goal)].map((g) => L.goals[g]).join(" + "),
    intro: t.intro(p.firstName),
    tips: t.tips,
    warnings: [...warnings, t.warnMedical],
    weeks: full ? weeks : weeks.slice(0, FREE_WEEKS),
    access: full ? "full" : "free",
    totalWeeks: weeks.length,
    ...(raceDay && p.raceDate ? { raceDate: p.raceDate } : {}),
    ...(frame.start ? { startDate: frame.start } : {}),
    personalizedByAI: false,
    createdAt: new Date().toISOString(),
  };
}
