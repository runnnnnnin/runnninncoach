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
}) {
  if (!dbConfigured()) return false;
  const s = await sql();
  await s`INSERT INTO testers (id, first_name, email, consent_news, goal, level, profile, plan, ai, ip_hash)
    VALUES (${input.id}, ${input.profile.firstName}, ${input.email}, ${input.consentNews}, ${input.profile.goal},
            ${input.profile.level}, ${JSON.stringify(input.profile)}, ${JSON.stringify(input.plan)},
            ${input.plan.personalizedByAI}, ${input.ipHash})`;
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

export type TesterRow = {
  id: string;
  created_at: string;
  first_name: string;
  email: string;
  consent_news: boolean;
  goal: string;
  level: string;
  ai: boolean;
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
      (SELECT string_agg(x->>'sport', ', ') FROM jsonb_array_elements(t.profile->'otherSports') x) AS other_sports,
      (SELECT count(*)::int FROM feedback f WHERE f.tester_id = t.id) AS feedback_count
    FROM testers t ORDER BY t.created_at DESC LIMIT 500`) as TesterRow[];
  const feedback = (await s`
    SELECT t.first_name, t.email, f.week, f.sessions_done, f.sessions_planned, f.feeling, f.pain, f.comment, f.created_at
    FROM feedback f JOIN testers t ON t.id = f.tester_id ORDER BY f.created_at DESC LIMIT 500`) as FeedbackRow[];
  return { testers, feedback };
}
