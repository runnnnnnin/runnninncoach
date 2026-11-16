/**
 * Base de données (Neon Postgres, branchée via Vercel).
 * Sans DATABASE_URL (ex. en local), tout continue de marcher : rien n'est simplement enregistré.
 * Les tables sont créées automatiquement au premier usage.
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { createHash } from "node:crypto";
import type { Plan, Profile } from "./types";

const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL;
export const dbConfigured = () => Boolean(url());

let _sql: NeonQueryFunction<false, false> | null = null;
let _ready: Promise<void> | null = null;

async function sql() {
  if (!_sql) _sql = neon(url()!);
  if (!_ready) {
    const s = _sql;
    _ready = (async () => {
      await s`CREATE TABLE IF NOT EXISTS testers (
        id uuid PRIMARY KEY,
        created_at timestamptz NOT NULL DEFAULT now(),
        first_name text NOT NULL,
        email text NOT NULL,
        consent_news boolean NOT NULL DEFAULT false,
        goal text NOT NULL,
        level text NOT NULL,
        profile jsonb NOT NULL,
        plan jsonb NOT NULL,
        ai boolean NOT NULL DEFAULT false,
        ip_hash text
      )`;
      await s`CREATE INDEX IF NOT EXISTS testers_ip_created ON testers (ip_hash, created_at)`;
      await s`CREATE TABLE IF NOT EXISTS feedback (
        id bigserial PRIMARY KEY,
        tester_id uuid NOT NULL REFERENCES testers(id) ON DELETE CASCADE,
        week int NOT NULL,
        sessions_done int NOT NULL,
        sessions_planned int NOT NULL,
        feeling text NOT NULL,
        pain boolean NOT NULL DEFAULT false,
        comment text,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tester_id, week)
      )`;
      // Comptes : un utilisateur retrouve ses plans ; les séances cochées sont liées au plan.
      await s`CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        first_name text,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await s`CREATE TABLE IF NOT EXISTS sessions (
        token_hash text PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await s`ALTER TABLE testers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL`;
      await s`CREATE INDEX IF NOT EXISTS testers_user ON testers (user_id)`;
      await s`CREATE TABLE IF NOT EXISTS completions (
        tester_id uuid NOT NULL REFERENCES testers(id) ON DELETE CASCADE,
        session_id text NOT NULL,
        done_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (tester_id, session_id)
      )`;
      await s`CREATE TABLE IF NOT EXISTS auth_attempts (ip_hash text NOT NULL, at timestamptz NOT NULL DEFAULT now())`;
      await s`CREATE INDEX IF NOT EXISTS auth_attempts_ip ON auth_attempts (ip_hash, at)`;
    })().catch((e) => {
      _ready = null;
      throw e;
    });
  }
  await _ready;
  return _sql;
}

export function hashIp(ip: string | null) {
  if (!ip) return null;
  return createHash("sha256").update(`runflow:${ip}`).digest("hex").slice(0, 32);
}

/** Nombre de plans créés depuis cette adresse dans la dernière heure (anti-abus). */
export async function recentPlansFrom(ipHash: string | null) {
  if (!dbConfigured() || !ipHash) return 0;
  const s = await sql();
  const rows = await s`SELECT count(*)::int AS n FROM testers WHERE ip_hash = ${ipHash} AND created_at > now() - interval '1 hour'`;
  return (rows[0]?.n as number) ?? 0;
}

export async function saveTester(input: {
  id: string;
  email: string;
  consentNews: boolean;
  profile: Profile;
  plan: Plan;
  ipHash: string | null;
  userId?: string | null;
}) {
  if (!dbConfigured()) return false;
  const s = await sql();
  await s`INSERT INTO testers (id, first_name, email, consent_news, goal, level, profile, plan, ai, ip_hash, user_id)
    VALUES (${input.id}, ${input.profile.firstName}, ${input.email}, ${input.consentNews}, ${input.profile.goal},
            ${input.profile.level}, ${JSON.stringify(input.profile)}, ${JSON.stringify(input.plan)},
            ${input.plan.personalizedByAI}, ${input.ipHash}, ${input.userId ?? null})`;
  return true;
}

export async function saveFeedback(f: {
  testerId: string;
  week: number;
  sessionsDone: number;
  sessionsPlanned: number;
  feeling: string;
  pain: boolean;
  comment: string | null;
}) {
  if (!dbConfigured()) return "no-db" as const;
  const s = await sql();
  const exists = await s`SELECT 1 FROM testers WHERE id = ${f.testerId}`;
  if (!exists.length) return "unknown" as const;
  await s`INSERT INTO feedback (tester_id, week, sessions_done, sessions_planned, feeling, pain, comment)
    VALUES (${f.testerId}, ${f.week}, ${f.sessionsDone}, ${f.sessionsPlanned}, ${f.feeling}, ${f.pain}, ${f.comment})
    ON CONFLICT (tester_id, week) DO UPDATE SET sessions_done = EXCLUDED.sessions_done,
      sessions_planned = EXCLUDED.sessions_planned, feeling = EXCLUDED.feeling, pain = EXCLUDED.pain,
      comment = EXCLUDED.comment, created_at = now()`;
  return "ok" as const;
}

export async function getTesterPlan(id: string): Promise<Plan | null> {
  if (!dbConfigured()) return null;
  const s = await sql();
  const rows = await s`SELECT plan FROM testers WHERE id = ${id}`;
  return (rows[0]?.plan as Plan) ?? null;
}

export type TesterRow = {
  id: string;
  created_at: string;
  first_name: string;
  email: string;
  consent_news: boolean;
  goal: string;
  level: string;
  ai: boolean;
  lang: string;
  other_sports: string | null;
  feedback_count: number;
};

export type FeedbackRow = {
  first_name: string;
  email: string;
  week: number;
  sessions_done: number;
  sessions_planned: number;
  feeling: string;
  pain: boolean;
  comment: string | null;
  created_at: string;
};

export async function adminData() {
  const s = await sql();
  const testers = (await s`
    SELECT t.id, t.created_at, t.first_name, t.email, t.consent_news, t.goal, t.level, t.ai,
      coalesce(t.profile->>'lang', 'fr') AS lang,
      (SELECT string_agg(x->>'sport', ', ') FROM jsonb_array_elements(t.profile->'otherSports') x) AS other_sports,
      (SELECT count(*)::int FROM feedback f WHERE f.tester_id = t.id) AS feedback_count
    FROM testers t ORDER BY t.created_at DESC LIMIT 500`) as TesterRow[];
  const feedback = (await s`
    SELECT t.first_name, t.email, f.week, f.sessions_done, f.sessions_planned, f.feeling, f.pain, f.comment, f.created_at
    FROM feedback f JOIN testers t ON t.id = f.tester_id ORDER BY f.created_at DESC LIMIT 500`) as FeedbackRow[];
  return { testers, feedback };
}

/** Toutes les données pour l'export Excel (inscrits avec leur profil complet + tous les retours). */
export async function exportData() {
  const s = await sql();
  const testers = (await s`
    SELECT t.id, t.created_at, t.first_name, t.email, t.consent_news, t.ai, t.profile,
      (SELECT count(*)::int FROM feedback f WHERE f.tester_id = t.id) AS feedback_count,
      (SELECT max(f.week)::int FROM feedback f WHERE f.tester_id = t.id) AS last_week,
      (t.user_id IS NOT NULL) AS has_account,
      (SELECT count(*)::int FROM completions c WHERE c.tester_id = t.id) AS checked,
      (SELECT round(avg(f.sessions_done::numeric / nullif(f.sessions_planned, 0)) * 100)::int FROM feedback f WHERE f.tester_id = t.id) AS done_pct
    FROM testers t ORDER BY t.created_at DESC`) as {
    id: string;
    created_at: string;
    first_name: string;
    email: string;
    consent_news: boolean;
    ai: boolean;
    profile: Profile;
    feedback_count: number;
    last_week: number | null;
    has_account: boolean;
    checked: number;
    done_pct: number | null;
  }[];
  const feedback = (await s`
    SELECT f.created_at, t.first_name, t.email, f.week, f.sessions_done, f.sessions_planned, f.feeling, f.pain, f.comment
    FROM feedback f JOIN testers t ON t.id = f.tester_id ORDER BY f.created_at DESC`) as FeedbackRow[];
  return { testers, feedback };
}

/* ---------- Comptes ---------- */

export type User = { id: string; email: string; first_name: string | null };

/** Limite les essais de connexion / inscription : 10 par quart d'heure et par adresse. */
export async function authAttemptAllowed(ipHash: string | null) {
  if (!ipHash) return true;
  const s = await sql();
  const rows = await s`SELECT count(*)::int AS n FROM auth_attempts WHERE ip_hash = ${ipHash} AND at > now() - interval '15 minutes'`;
  if (((rows[0]?.n as number) ?? 0) >= 10) return false;
  await s`INSERT INTO auth_attempts (ip_hash) VALUES (${ipHash})`;
  await s`DELETE FROM auth_attempts WHERE at < now() - interval '1 day'`;
  return true;
}

export async function createUser(u: { id: string; email: string; passwordHash: string; firstName: string | null }) {
  const s = await sql();
  const rows = await s`INSERT INTO users (id, email, password_hash, first_name) VALUES (${u.id}, ${u.email}, ${u.passwordHash}, ${u.firstName})
    ON CONFLICT (email) DO NOTHING RETURNING id`;
  return rows.length > 0;
}

export async function userByEmail(email: string) {
  const s = await sql();
  const rows = await s`SELECT id, email, first_name, password_hash FROM users WHERE email = ${email}`;
  return (rows[0] as (User & { password_hash: string }) | undefined) ?? null;
}

export async function createSession(tokenHash: string, userId: string, days: number) {
  const s = await sql();
  await s`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (${tokenHash}, ${userId}, now() + make_interval(days => ${days}))`;
  await s`DELETE FROM sessions WHERE expires_at < now()`;
}

export async function userBySession(tokenHash: string): Promise<User | null> {
  const s = await sql();
  const rows = await s`SELECT u.id, u.email, u.first_name FROM sessions x JOIN users u ON u.id = x.user_id
    WHERE x.token_hash = ${tokenHash} AND x.expires_at > now()`;
  return (rows[0] as User | undefined) ?? null;
}

export async function deleteSession(tokenHash: string) {
  const s = await sql();
  await s`DELETE FROM sessions WHERE token_hash = ${tokenHash}`;
}

/** Supprime le compte, ses plans, ses retours et ses séances cochées. */
export async function deleteUser(userId: string) {
  const s = await sql();
  await s`DELETE FROM testers WHERE user_id = ${userId}`;
  await s`DELETE FROM users WHERE id = ${userId}`;
}

/** Rattache au compte un plan créé avant la connexion (seulement s'il n'appartient à personne). */
export async function claimPlan(testerId: string, userId: string) {
  const s = await sql();
  await s`UPDATE testers SET user_id = ${userId} WHERE id = ${testerId} AND user_id IS NULL`;
}

export type PlanSummary = { id: string; created_at: string; goal_label: string; lang: string; total: number; done: number };

export async function plansOf(userId: string) {
  const s = await sql();
  return (await s`
    SELECT t.id, t.created_at, t.plan->>'goalLabel' AS goal_label, coalesce(t.plan->>'lang', 'en') AS lang,
      (SELECT count(*)::int FROM jsonb_array_elements(t.plan->'weeks') w, jsonb_array_elements(w->'days') d, jsonb_array_elements(d->'sessions') x) AS total,
      (SELECT count(*)::int FROM completions c WHERE c.tester_id = t.id) AS done
    FROM testers t WHERE t.user_id = ${userId} ORDER BY t.created_at DESC LIMIT 50`) as PlanSummary[];
}

export async function planOf(testerId: string, userId: string): Promise<Plan | null> {
  const s = await sql();
  const rows = await s`SELECT plan FROM testers WHERE id = ${testerId} AND user_id = ${userId}`;
  return rows[0] ? ({ ...(rows[0].plan as Plan), testerId } as Plan) : null;
}

export async function deletePlan(testerId: string, userId: string) {
  const s = await sql();
  await s`DELETE FROM testers WHERE id = ${testerId} AND user_id = ${userId}`;
}

/* ---------- Séances cochées ---------- */

export async function completionsOf(testerId: string) {
  const s = await sql();
  const rows = await s`SELECT session_id, done_at FROM completions WHERE tester_id = ${testerId}`;
  return Object.fromEntries(rows.map((r) => [r.session_id as string, new Date(r.done_at as string).toISOString()]));
}

export async function setCompletion(testerId: string, sessionId: string, done: boolean) {
  const s = await sql();
  // La séance doit exister dans ce plan.
  const exists = await s`SELECT 1 FROM testers WHERE id = ${testerId}
    AND jsonb_path_exists(plan, '$.weeks[*].days[*].sessions[*] ? (@.id == $sid)', jsonb_build_object('sid', ${sessionId}::text))`;
  if (!exists.length) return false;
  if (done) await s`INSERT INTO completions (tester_id, session_id) VALUES (${testerId}, ${sessionId}) ON CONFLICT DO NOTHING`;
  else await s`DELETE FROM completions WHERE tester_id = ${testerId} AND session_id = ${sessionId}`;
  return true;
}
