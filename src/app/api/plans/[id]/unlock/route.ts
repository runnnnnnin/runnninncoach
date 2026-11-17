import { currentUser } from "@/lib/auth";
import { unlockPlan } from "@/lib/unlock";

// Débloque un plan gratuit du compte (abonnement Coach actif ou plan complet acheté).
export async function POST(_req: Request, ctx: RouteContext<"/api/plans/[id]/unlock">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return Response.json({ error: "invalid" }, { status: 400 });
  const user = await currentUser();
  if (!user) return Response.json({ error: "login" }, { status: 401 });
  const r = await unlockPlan(user, id);
  if (r === "not-found") return Response.json({ error: "not-found" }, { status: 404 });
  if (r === "no-access") return Response.json({ error: "no-access" }, { status: 402 });
  return Response.json(r);
}
