import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { markStravaSync, planForSync, progressOf, saveStravaMatch } from "@/lib/db";
import { listActivities, matchSessions, stravaConfigured } from "@/lib/strava";
import { stravaAccess } from "@/lib/strava-account";

const schema = z.object({
  plan: z.string().uuid(),
  /** Lundi de la semaine 1. Fourni quand la personne le choisit ou le change. */
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** Synchronisation automatique à l'ouverture du plan : ignorée si la dernière date de moins de 10 minutes. */
  auto: z.boolean().optional(),
});

// Lit les activités Strava depuis le début du plan et coche les séances qui correspondent.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const user = await currentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!stravaConfigured()) return Response.json({ error: "unavailable" }, { status: 503 });

  try {
    const { plan: testerId, start, auto } = parsed.data;
    const meta = await planForSync(testerId, user.id, start ?? null);
    if (!meta) return Response.json({ error: "notFound" }, { status: 404 });
    if (!meta.start) return Response.json({ error: "noStart" }, { status: 409 });
    const access = await stravaAccess(user.id);
    if (!access) return Response.json({ error: "notConnected" }, { status: 409 });

    let matched = 0;
    if (!(auto && access.recentlySynced)) {
      // Un jour de marge avant le lundi de départ, pour les séances faites la veille.
      const after = Math.floor(new Date(`${meta.start}T00:00:00Z`).getTime() / 1000) - 86_400;
      const activities = await listActivities(access.token, after);
      const matches = matchSessions(meta.plan, meta.start, activities, new Set(meta.used));
      for (const m of matches) await saveStravaMatch(testerId, m);
      matched = matches.length;
      await markStravaSync(user.id);
    }
    return Response.json({ ok: true, matched, ...(await progressOf(testerId)) });
  } catch (e) {
    console.error("[RunFlow] Synchronisation Strava impossible :", e);
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
