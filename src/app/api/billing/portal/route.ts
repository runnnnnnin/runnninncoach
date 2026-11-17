import { z } from "zod";
import { LOCALES } from "@/i18n/config";
import { currentUser } from "@/lib/auth";
import { billingConfigured, portalUrl } from "@/lib/billing";

// Espace client Stripe : factures, carte, résiliation de l'abonnement.
export async function POST(req: Request) {
  if (!billingConfigured()) return Response.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return Response.json({ error: "login" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { lang?: string } | null;
  const lang = z.enum(LOCALES).catch("en").parse(body?.lang);
  try {
    return Response.json({ url: await portalUrl(user, `${new URL(req.url).origin}/${lang}/plans?billing=1`) });
  } catch (e) {
    console.error("[RunFlow] Espace client Stripe indisponible :", e);
    return Response.json({ error: "stripe" }, { status: 502 });
  }
}
