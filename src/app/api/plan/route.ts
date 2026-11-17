import { z } from "zod";
import { buildPlan } from "@/lib/engine";
import { personalize } from "@/lib/ai";
import { currentUser } from "@/lib/auth";
import { accessOf, billingConfigured } from "@/lib/billing";
import { hashIp, recentPlansFrom, saveTester, setUserFirstName, consumePlanCredit } from "@/lib/db";
import { profileSchema } from "@/lib/types";

const requestSchema = profileSchema.extend({
  email: z.string().trim().toLowerCase().email().max(200),
  consentNews: z.boolean().default(false),
  website: z.string().max(0).optional(), // champ piège invisible : rempli = robot
});

const MAX_PLANS_PER_HOUR = 5;

const ERRORS = {
  en: { invalid: "Some answers are missing or invalid (check your email).", tooMany: "You've already created several plans this hour. Please try again a bit later." },
  fr: { invalid: "Certaines réponses sont manquantes ou invalides (vérifie ton email).", tooMany: "Tu as déjà créé plusieurs plans cette heure-ci. Réessaie un peu plus tard." },
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  const err = ERRORS[body?.lang === "fr" ? "fr" : "en"];
  if (!parsed.success) {
    return Response.json({ error: err.invalid }, { status: 400 });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email: typedEmail, consentNews, website, ...profile } = parsed.data;
  // Connecté : le plan est lié au compte et à son email, pas à ce qui est envoyé par la page.
  const user = await currentUser().catch(() => null);
  const email = user?.email ?? typedEmail;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ipHash = hashIp(ip);
  try {
    if ((await recentPlansFrom(ipHash)) >= MAX_PLANS_PER_HOUR) {
      return Response.json({ error: err.tooMany }, { status: 429 });
    }
  } catch (e) {
    console.error("[RunFlow] Vérification anti-abus impossible :", e);
  }

  // Paiements branchés : 2 semaines gratuites, plan complet avec l'abonnement Coach ou un plan complet acheté.
  let full = !billingConfigured();
  let useCredit = false;
  if (!full && user) {
    const access = await accessOf(user.id);
    full = access.coach || access.credits > 0;
    useCredit = !access.coach && access.credits > 0;
  }

  const plan = await personalize(profile, buildPlan(profile, { full }));
  const testerId = crypto.randomUUID();
  let saved = false;
  try {
    // Connecté : le plan est rangé directement dans « Mes plans », et le prénom est retenu pour la prochaine fois.
    if (user && !user.first_name) await setUserFirstName(user.id, profile.firstName).catch(() => {});
    saved = await saveTester({ id: testerId, email, consentNews, profile, plan, ipHash, userId: user?.id });
    if (saved && useCredit && user) await consumePlanCredit(user.id, testerId);
  } catch (e) {
    console.error("[RunFlow] Enregistrement du testeur impossible :", e);
  }

  return Response.json({ ...plan, testerId: saved ? testerId : undefined });
}
