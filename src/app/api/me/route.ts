import { currentUser, endSession } from "@/lib/auth";
import { deleteUser, plansOf, stravaConnected } from "@/lib/db";
import { accessOf } from "@/lib/billing";
import { stravaConfigured } from "@/lib/strava";
import { disconnectStrava } from "@/lib/strava-account";

// Qui est connecté, et ses plans.
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  const plans = await plansOf(user.id).catch(() => []);
  const strava = { available: stravaConfigured(), connected: stravaConfigured() && (await stravaConnected(user.id).catch(() => false)) };
  const billing = await accessOf(user.id).catch(() => null);
  return Response.json(
    { user: { email: user.email, firstName: user.first_name }, plans, strava, billing },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// Suppression du compte et de toutes ses données.
export async function DELETE() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  // On retire aussi l'accès côté Strava.
  if (stravaConfigured()) await disconnectStrava(user.id).catch(() => {});
  await deleteUser(user.id);
  await endSession();
  return Response.json({ ok: true });
}
