/** Séances cochées : série en cours, record et badges. Calculé à partir du plan, sans dépendance. */
import type { Plan, Session } from "./types";

/** Identifiant de séance -> date à laquelle elle a été cochée. */
export type Done = Record<string, string>;

export const BADGE_KEYS = ["first", "row3", "week", "key", "long", "strong", "half", "row8", "all"] as const;
export type BadgeKey = (typeof BADGE_KEYS)[number];

export function allSessions(plan: Plan): Session[] {
  return plan.weeks.flatMap((w) => w.days.flatMap((d) => d.sessions));
}

export function computeProgress(plan: Plan, done: Done) {
  const sessions = allSessions(plan);
  const flags = sessions.map((s) => Boolean(done[s.id]));
  const total = sessions.length;
  const count = flags.filter(Boolean).length;

  // Série : séances faites d'affilée, dans l'ordre du plan. Sauter une séance remet la série à zéro.
  let best = 0, run = 0;
  for (const f of flags) {
    run = f ? run + 1 : 0;
    best = Math.max(best, run);
  }
  const last = flags.lastIndexOf(true);
  let streak = 0;
  for (let i = last; i >= 0 && flags[i]; i--) streak++;

  const weeks = plan.weeks.map((w) => {
    const ids = w.days.flatMap((d) => d.sessions.map((s) => s.id));
    return { total: ids.length, done: ids.filter((id) => done[id]).length };
  });
  const kindDone = (k: Session["kind"]) => sessions.filter((s) => s.kind === k && done[s.id]).length;
  const has = (k: Session["kind"], n = 1) => sessions.filter((s) => s.kind === k).length >= n;

  // Seuls les badges atteignables avec ce plan sont proposés.
  const rules: Record<BadgeKey, { possible: boolean; earned: boolean }> = {
    first: { possible: total >= 1, earned: count >= 1 },
    row3: { possible: total >= 3, earned: best >= 3 },
    week: { possible: weeks.some((w) => w.total > 0), earned: weeks.some((w) => w.total > 0 && w.done === w.total) },
    key: { possible: has("qualite"), earned: kindDone("qualite") >= 1 },
    long: { possible: has("longue"), earned: kindDone("longue") >= 1 },
    strong: { possible: has("renfo", 2), earned: kindDone("renfo") >= 2 },
    half: { possible: total >= 4, earned: count >= Math.ceil(total / 2) },
    row8: { possible: total >= 8, earned: best >= 8 },
    all: { possible: total >= 1, earned: total > 0 && count === total },
  };
  const badges = BADGE_KEYS.filter((k) => rules[k].possible).map((k) => ({ key: k, earned: rules[k].earned }));

  return { total, count, streak, best, weeks, badges };
}

/* Copie locale : la progression marche même sans compte ni base. */
const key = (planKey: string) => `runflow.done.${planKey}`;

export function loadDone(planKey: string): Done {
  try {
    return JSON.parse(localStorage.getItem(key(planKey)) ?? "{}") as Done;
  } catch {
    return {};
  }
}

export function saveDone(planKey: string, done: Done) {
  try {
    localStorage.setItem(key(planKey), JSON.stringify(done));
  } catch {}
}
