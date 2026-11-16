/**
 * Connexion Strava (OAuth) : la personne relie son compte, RunFlow lit ses activités
 * et coche les séances du plan qui correspondent.
 * Actif seulement si STRAVA_CLIENT_ID et STRAVA_CLIENT_SECRET sont définis dans Vercel.
 * Les données Strava ne sont jamais envoyées au modèle d'IA, et ne sont montrées qu'à leur propriétaire.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { DAYS, type Plan, type SessionKind } from "./types";

export const stravaConfigured = () => Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET);
export const STRAVA_STATE_COOKIE = "rf_strava_state";

/* Les jetons Strava sont chiffrés avant d'être rangés en base. */
const secretKey = () => createHash("sha256").update(`runflow-strava:${process.env.STRAVA_CLIENT_SECRET ?? ""}`).digest();

export function seal(text: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const data = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function unseal(sealed: string) {
  const [iv, tag, data] = sealed.split(".").map((x) => Buffer.from(x, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function authorizeUrl(redirectUri: string, state: string) {
  const q = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read",
    state,
  });
  return `https://www.strava.com/oauth/authorize?${q}`;
}

export type StravaTokens = { access_token: string; refresh_token: string; expires_at: number; athlete?: { id: number } };

async function tokenRequest(params: Record<string, string>): Promise<StravaTokens> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: process.env.STRAVA_CLIENT_ID, client_secret: process.env.STRAVA_CLIENT_SECRET, ...params }),
  });
  if (!res.ok) throw new Error(`Strava token ${res.status}`);
  return (await res.json()) as StravaTokens;
}

export const exchangeCode = (code: string) => tokenRequest({ code, grant_type: "authorization_code" });
export const refreshTokens = (refreshToken: string) => tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });

export async function deauthorize(accessToken: string) {
  await fetch("https://www.strava.com/oauth/deauthorize", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => {});
}

export type Activity = { id: number; sport_type?: string; type?: string; start_date_local: string; distance: number; moving_time: number };

/** Activités depuis une date (2 pages de 100 au plus : largement assez pour un plan de 4 semaines). */
export async function listActivities(accessToken: string, afterEpoch: number): Promise<Activity[]> {
  const all: Activity[] = [];
  for (let page = 1; page <= 2; page++) {
    const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${afterEpoch}&per_page=100&page=${page}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Strava activities ${res.status}`);
    const batch = (await res.json()) as Activity[];
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"]);
const WALK_TYPES = new Set(["Walk", "Hike"]);
const STRENGTH_TYPES = new Set(["WeightTraining", "Workout", "Crossfit", "HighIntensityIntervalTraining", "Pilates", "Yoga"]);

function fits(kind: SessionKind, a: Activity) {
  const type = a.sport_type ?? a.type ?? "";
  if (kind === "renfo") return STRENGTH_TYPES.has(type);
  if (kind === "marche-course") return RUN_TYPES.has(type) || WALK_TYPES.has(type);
  return RUN_TYPES.has(type);
}

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export type Match = { sessionId: string; activityId: number; distanceM: number; movingS: number };

/**
 * Associe les activités aux séances du plan. `start` est le lundi de la semaine 1 (AAAA-MM-JJ).
 * D'abord le même jour, puis la veille ou le lendemain. Une activité ne sert qu'une fois.
 */
export function matchSessions(plan: Plan, start: string, activities: Activity[], alreadyUsed: Set<number> = new Set()): Match[] {
  const sessions = plan.weeks.flatMap((w, wi) =>
    w.days.flatMap((d) => d.sessions.map((s) => ({ id: s.id, kind: s.kind, date: addDays(start, wi * 7 + DAYS.indexOf(d.day)) }))),
  );
  const used = new Set(alreadyUsed);
  const matches: Match[] = [];
  const matched = new Set<string>();
  for (const offsets of [[0], [-1, 1]]) {
    for (const s of sessions) {
      if (matched.has(s.id)) continue;
      const dates = new Set(offsets.map((o) => addDays(s.date, o)));
      const a = activities.find((x) => !used.has(x.id) && dates.has(x.start_date_local.slice(0, 10)) && fits(s.kind, x));
      if (!a) continue;
      used.add(a.id);
      matched.add(s.id);
      matches.push({ sessionId: s.id, activityId: a.id, distanceM: Math.round(a.distance), movingS: Math.round(a.moving_time) });
    }
  }
  return matches;
}
