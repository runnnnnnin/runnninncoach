import { buildPlan } from "@/lib/engine";
import { personalize } from "@/lib/ai";
import { profileSchema } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Certaines réponses sont manquantes ou invalides." }, { status: 400 });
  }
  const plan = await personalize(parsed.data, buildPlan(parsed.data));
  return Response.json(plan);
}
