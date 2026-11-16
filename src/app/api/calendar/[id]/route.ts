import { z } from "zod";
import { getTesterPlan } from "@/lib/db";
import { planToIcs } from "@/lib/ics";

const query = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  lang: z.enum(["en", "fr"]).default("en"),
});

// Télécharge le plan d'un testeur au format calendrier (.ics).
export async function GET(req: Request, { params }: RouteContext<"/api/calendar/[id]">) {
  const { id } = await params;
  const url = new URL(req.url);
  const parsed = query.safeParse({
    start: url.searchParams.get("start"),
    time: url.searchParams.get("time") || null,
    lang: url.searchParams.get("lang") ?? undefined,
  });
  if (!z.string().uuid().safeParse(id).success || !parsed.success) return new Response("Bad request", { status: 400 });

  const plan = await getTesterPlan(id).catch(() => null);
  if (!plan) return new Response("Not found", { status: 404 });

  return new Response(planToIcs(plan, parsed.data), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="runflow-plan.ics"',
      "Cache-Control": "no-store",
    },
  });
}
