import { z } from "zod";
import { completionsOf, dbConfigured, setCompletion } from "@/lib/db";

// Séances cochées d'un plan. L'identifiant du plan (introuvable au hasard) sert de clé d'accès,
// comme pour le calendrier : ça marche avec ou sans compte.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("plan");
  if (!z.string().uuid().safeParse(id).success) return Response.json({ error: "invalid" }, { status: 400 });
  if (!dbConfigured()) return Response.json({ done: {} });
  const done = await completionsOf(id!).catch(() => ({}));
  return Response.json({ done }, { headers: { "Cache-Control": "no-store" } });
}

const schema = z.object({
  plan: z.string().uuid(),
  session: z.string().regex(/^s\d{1,2}-[a-z]{3}-[a-z-]{2,20}$/),
  done: z.boolean(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  if (!dbConfigured()) return Response.json({ ok: true, saved: false });
  try {
    const ok = await setCompletion(parsed.data.plan, parsed.data.session, parsed.data.done);
    return ok ? Response.json({ ok: true, saved: true }) : Response.json({ error: "notFound" }, { status: 404 });
  } catch (e) {
    console.error("[RunFlow] Séance cochée non enregistrée :", e);
    return Response.json({ error: "unavailable" }, { status: 500 });
  }
}
