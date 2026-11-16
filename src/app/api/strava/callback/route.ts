import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { saveStrava } from "@/lib/db";
import { exchangeCode, seal, STRAVA_STATE_COOKIE, stravaConfigured } from "@/lib/strava";

// Retour de Strava après l'autorisation : on échange le code contre des jetons, rangés chiffrés.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = process.env.VERCEL ? BRAND.siteUrl : url.origin;
  const jar = await cookies();
  const [state, cookieLang] = (jar.get(STRAVA_STATE_COOKIE)?.value ?? "").split(".");
  jar.delete({ name: STRAVA_STATE_COOKIE, path: "/api/strava" });
  const lang = cookieLang === "fr" ? "fr" : "en";
  const back = (result: string) => Response.redirect(`${base}/${lang}/plans?strava=${result}`, 302);

  const user = await currentUser();
  if (!user) return Response.redirect(`${base}/${lang}/login`, 302);
  if (!stravaConfigured()) return back("unavailable");
  // La personne a refusé, ou la demande ne vient pas de nous.
  if (url.searchParams.get("error")) return back("denied");
  const code = url.searchParams.get("code");
  if (!code || !state || url.searchParams.get("state") !== state) return back("error");
  // Sans le droit de lire les activités, la liaison ne sert à rien.
  if (!(url.searchParams.get("scope") ?? "").split(",").includes("activity:read")) return back("scope");

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.athlete?.id) return back("error");
    await saveStrava({
      userId: user.id,
      athleteId: tokens.athlete.id,
      accessToken: seal(tokens.access_token),
      refreshToken: seal(tokens.refresh_token),
      expiresAt: tokens.expires_at,
    });
    return back("connected");
  } catch (e) {
    console.error("[RunFlow] Liaison Strava impossible :", e);
    return back("error");
  }
}
