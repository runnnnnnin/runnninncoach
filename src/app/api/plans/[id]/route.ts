import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { deletePlan, planOf } from "@/lib/db";

async function guard(params: Promise<{ id: string }>) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return { error: Response.json({ error: "unauthorized" }, { status: 401 }) } as const;
  if (!z.string().uuid().safeParse(id).success) return { error: Response.json({ error: "invalid" }, { status: 400 }) } as const;
  return { id, user } as const;
}

// Un plan du compte connecté (jamais celui de quelqu'un d'autre).
export async function GET(_req: Request, { params }: RouteContext<"/api/plans/[id]">) {
  const g = await guard(params);
  if ("error" in g) return g.error;
  const plan = await planOf(g.id, g.user.id);
  if (!plan) return Response.json({ error: "notFound" }, { status: 404 });
  return Response.json(plan, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_req: Request, { params }: RouteContext<"/api/plans/[id]">) {
  const g = await guard(params);
  if ("error" in g) return g.error;
  await deletePlan(g.id, g.user.id);
  return Response.json({ ok: true });
}
