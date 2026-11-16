import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { authorizeUrl, STRAVA_STATE_COOKIE, stravaConfigured } from "@/lib/strava";

const origin = (req: Request) => (process.env.VERCEL ? BRAND.siteUrl : new URL(req.url).origin);

// Départ de la liaison : on envoie la personne sur Strava pour qu'elle autorise RunFlow.
export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get("lang") === "fr" ? "fr" : "en";
  const base = origin(req);
  const user = await currentUser();
  if (!user) return Response.redirect(`${base}/${lang}/login`, 302);
  if (!stravaConfigured()) return Response.redirect(`${base}/${lang}/plans?strava=unavailable`, 302);

  const state = randomBytes(16).toString("hex");
  (await cookies()).set(STRAVA_STATE_COOKIE, `${state}.${lang}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/strava",
    maxAge: 600,
  });
  return Response.redirect(authorizeUrl(`${base}/api/strava/callback`, state), 302);
}
