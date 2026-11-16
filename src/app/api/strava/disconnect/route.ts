import { currentUser } from "@/lib/auth";
import { disconnectStrava } from "@/lib/strava-account";

// Retire l'accès de RunFlow côté Strava et efface ce qui venait de Strava.
export async function POST() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    await disconnectStrava(user.id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[RunFlow] Déconnexion Strava impossible :", e);
    return Response.json({ error: "unavailable" }, { status: 500 });
  }
}
