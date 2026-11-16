import { z } from "zod";
import { buildPlan } from "@/lib/engine";
import { personalize } from "@/lib/ai";
import { hashIp, recentPlansFrom, saveTester } from "@/lib/db";
import { profileSchema } from "@/lib/types";

const requestSchema = profileSchema.extend({
  email: z.string().trim().toLowerCase().email().max(200),
  consentNews: z.boolean().default(false),
  website: z.string().max(0).optional(), // champ piège invisible : rempli = robot
});

const MAX_PLANS_PER_HOUR = 5;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Certaines réponses sont manquantes ou invalides (vérifie ton email)." }, { status: 400 });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email, consentNews, website, ...profile } = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ipHash = hashIp(ip);
  try {
    if ((await recentPlansFrom(ipHash)) >= MAX_PLANS_PER_HOUR) {
      return Response.json({ error: "Tu as déjà créé plusieurs plans cette heure-ci. Réessaie un peu plus tard." }, { status: 429 });
    }
  } catch (e) {
    console.error("[RunFlow] Vérification anti-abus impossible :", e);
  }

  const plan = await personalize(profile, buildPlan(profile));
  const testerId = crypto.randomUUID();
  let saved = false;
  try {
    saved = await saveTester({ id: testerId, email, consentNews, profile, plan, ipHash });
  } catch (e) {
    console.error("[RunFlow] Enregistrement du testeur impossible :", e);
  }

  return Response.json({ ...plan, testerId: saved ? testerId : undefined });
}
