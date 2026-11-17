import { hasLocale } from "@/i18n/config";
import { currentUser } from "@/lib/auth";
import { billingConfigured, recordIfPaid, stripe, syncBilling } from "@/lib/billing";
import { unlockPlan } from "@/lib/unlock";

// Retour de la page de paiement Stripe : on vérifie le paiement chez Stripe, puis on débloque le plan concerné.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = hasLocale(url.searchParams.get("lang") ?? "") ? url.searchParams.get("lang")! : "en";
  const to = (path: string) => Response.redirect(new URL(`/${lang}${path}`, url.origin), 303);
  const id = url.searchParams.get("session_id");
  if (!billingConfigured() || !id || !/^cs_[A-Za-z0-9_]+$/.test(id)) return to("/plans");
  const user = await currentUser();
  if (!user) return to("/login");
  try {
    const cs = await stripe().checkout.sessions.retrieve(id);
    if (cs.metadata?.user_id !== user.id) return to("/plans");
    if (cs.mode === "subscription") await syncBilling(user.id, true);
    else await recordIfPaid(cs, user.id);
    const planId = cs.metadata?.plan_id;
    if (planId) {
      const r = await unlockPlan(user, planId, cs.id);
      if (typeof r !== "string") return to(`/plans?unlocked=${planId}`);
    }
    return to(`/plans?paid=${cs.mode === "subscription" ? "coach" : "plan"}`);
  } catch (e) {
    console.error("[RunFlow] Retour de paiement :", e);
    return to("/plans?paid=pending");
  }
}
