import { z } from "zod";
import { clientIp, endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { authAttemptAllowed, claimPlan, createUser, dbConfigured, hashIp, userByEmail } from "@/lib/db";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("signup"),
    email: z.string().trim().toLowerCase().email().max(200),
    password: z.string().min(8).max(200),
    firstName: z.string().trim().max(40).optional(),
    claim: z.string().uuid().optional(),
  }),
  z.object({
    action: z.literal("login"),
    email: z.string().trim().toLowerCase().email().max(200),
    password: z.string().min(1).max(200),
    claim: z.string().uuid().optional(),
  }),
  z.object({ action: z.literal("logout") }),
]);

// Les erreurs sont des codes : la page les traduit (en / fr).
const fail = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid", 400);
  const data = parsed.data;

  if (data.action === "logout") {
    await endSession();
    return Response.json({ ok: true });
  }
  if (!dbConfigured()) return fail("unavailable", 503);

  try {
    if (!(await authAttemptAllowed(hashIp(clientIp(req))))) return fail("tooMany", 429);

    let userId: string;
    if (data.action === "signup") {
      userId = crypto.randomUUID();
      const created = await createUser({ id: userId, email: data.email, passwordHash: await hashPassword(data.password), firstName: data.firstName || null });
      if (!created) return fail("exists", 409);
    } else {
      const user = await userByEmail(data.email);
      // Même réponse que l'email existe ou non.
      if (!user || !(await verifyPassword(data.password, user.password_hash))) return fail("wrong", 401);
      userId = user.id;
    }
    await startSession(userId);
    if (data.claim) await claimPlan(data.claim, userId).catch(() => {});
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[RunFlow] Compte : opération impossible :", e);
    return fail("unavailable", 500);
  }
}
