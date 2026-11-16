import { z } from "zod";
import { saveFeedback } from "@/lib/db";

const schema = z.object({
  testerId: z.string().uuid(),
  week: z.number().int().min(1).max(4),
  sessionsDone: z.number().int().min(0).max(14),
  sessionsPlanned: z.number().int().min(0).max(14),
  feeling: z.enum(["trop_dur", "ok", "trop_facile"]),
  pain: z.boolean(),
  comment: z.string().trim().max(1000).nullable().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Retour invalide." }, { status: 400 });
  try {
    const r = await saveFeedback({ ...parsed.data, comment: parsed.data.comment || null });
    if (r === "unknown") return Response.json({ error: "Plan introuvable." }, { status: 404 });
    return Response.json({ ok: true, saved: r === "ok" });
  } catch (e) {
    console.error("[RunFlow] Enregistrement du retour impossible :", e);
    return Response.json({ error: "Impossible d'enregistrer ton retour pour le moment." }, { status: 500 });
  }
}
