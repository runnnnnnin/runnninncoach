import { currentUser, endSession } from "@/lib/auth";
import { deleteUser, plansOf } from "@/lib/db";

// Qui est connecté, et ses plans.
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  const plans = await plansOf(user.id).catch(() => []);
  return Response.json({ user: { email: user.email, firstName: user.first_name }, plans }, { headers: { "Cache-Control": "no-store" } });
}

// Suppression du compte et de toutes ses données.
export async function DELETE() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  await deleteUser(user.id);
  await endSession();
  return Response.json({ ok: true });
}
