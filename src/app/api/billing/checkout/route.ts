import { z } from "zod";
import { LOCALES } from "@/i18n/config";
import { currentUser } from "@/lib/auth";
import { accessOf, billingConfigured, createCheckout, portalUrl } from "@/lib/billing";

const schema = z.object({
  kind: z.enum(["plan", "coach"]),
  plan: z.string().uuid().optional(),
  lang: z.enum(LOCALES).default("en"),
  // Case cochée : exécution immédiate et renonciation au droit de rétractation (contenu numérique).
  consent: z.literal(true),
});

// Ouvre la page de paiement Stripe. Il faut être connecté : le paiement est rattaché au compte.
export async function POST(req: Request) {
  if (!billingConfigured()) return Response.json({ error: "unavailable" }, { status: 503 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const user = await currentUser();
  if (!user) return Response.json({ error: "login" }, { status: 401 });
  const { kind, plan, lang } = parsed.data;
  const origin = new URL(req.url).origin;
  try {
    // Déjà abonné : pas de second abonnement, on ouvre l'espace client.
    if (kind === "coach" && (await accessOf(user.id)).coach) {
      return Response.json({ url: await portalUrl(user, `${origin}/${lang}/plans`) });
    }
    const url = await createCheckout(user, kind, { planId: plan, lang, origin });
    return Response.json({ url });
  } catch (e) {
    console.error("[RunFlow] Création du paiement impossible :", e);
    return Response.json({ error: "stripe" }, { status: 502 });
  }
}
