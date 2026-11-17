import { personalize } from "./ai";
import { accessOf } from "./billing";
import { replacePlan, testerOf, consumePlanCredit, type User } from "./db";
import { buildPlan } from "./engine";
import type { Plan } from "./types";

/**
 * Rallonge un plan gratuit en plan complet : avec l'abonnement Coach, ou en utilisant un plan complet acheté.
 * Le plan est reconstruit en entier à partir du profil enregistré (les 2 premières semaines restent les mêmes).
 */
export async function unlockPlan(user: User, testerId: string, preferSession?: string): Promise<Plan | "not-found" | "no-access"> {
  const t = await testerOf(testerId, user.id);
  if (!t) return "not-found";
  if (t.plan.access !== "free") return { ...t.plan, testerId };
  const access = await accessOf(user.id);
  if (!access.coach && !(await consumePlanCredit(user.id, testerId, preferSession))) return "no-access";
  const plan = await personalize(t.profile, buildPlan(t.profile, { full: true }));
  await replacePlan(testerId, user.id, plan, t.profile, plan.startDate ?? null);
  return { ...plan, testerId };
}
