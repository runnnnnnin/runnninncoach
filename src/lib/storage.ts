import type { Plan } from "./types";

// Phase de test : le plan est gardé dans le navigateur. Les comptes viendront à l'étape 2.
const KEY = "runflow.plan";

export function savePlan(plan: Plan) {
  try {
    localStorage.setItem(KEY, JSON.stringify(plan));
  } catch {}
}

export function loadPlanRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
