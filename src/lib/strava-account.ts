/** Jeton Strava valide pour un compte (renouvelé s'il expire), et déconnexion propre. */
import { deleteStrava, getStrava, saveStrava } from "./db";
import { deauthorize, refreshTokens, seal, unseal } from "./strava";

export async function stravaAccess(userId: string) {
  const account = await getStrava(userId);
  if (!account) return null;
  try {
    // Encore valable plus de 2 minutes : on le garde.
    if (Number(account.expires_at) - 120 > Date.now() / 1000) return { token: unseal(account.access_token), recentlySynced: account.recently_synced };
    const fresh = await refreshTokens(unseal(account.refresh_token));
    await saveStrava({
      userId,
      athleteId: Number(account.athlete_id),
      accessToken: seal(fresh.access_token),
      refreshToken: seal(fresh.refresh_token),
      expiresAt: fresh.expires_at,
    });
    return { token: fresh.access_token, recentlySynced: account.recently_synced };
  } catch (e) {
    console.error("[RunFlow] Jeton Strava inutilisable :", e);
    return null;
  }
}

export async function disconnectStrava(userId: string) {
  const access = await stravaAccess(userId).catch(() => null);
  if (access) await deauthorize(access.token);
  await deleteStrava(userId);
}
