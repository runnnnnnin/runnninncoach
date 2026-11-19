import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { ADMIN_COOKIE, adminPasswordSet, adminToken, safeEqual } from "@/lib/admin-auth";
import { adminData, dbConfigured } from "@/lib/db";
import { LABELS } from "@/lib/labels";
import type { Goal, Level, SportKey } from "@/lib/types";

const FR = LABELS.fr;
import { login, logout } from "./actions";

export const metadata: Metadata = { title: "Admin · RunFlow", robots: { index: false, follow: false } };

const FEELING_LABEL: Record<string, string> = { trop_dur: "Trop dur", ok: "Juste bien", trop_facile: "Trop facile" };
const fmt = (d: string) =>
  new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="mt-10 max-w-lg border border-hairline p-5 leading-relaxed text-mist">{children}</p>;
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-night p-5">
      <p className="label text-fog">{label}</p>
      <p className="serif mt-2 text-5xl leading-none">{value}</p>
      {sub && <p className="mt-2 text-xs text-fog">{sub}</p>}
    </div>
  );
}

async function AdminContent({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  if (!adminPasswordSet())
    return (
      <Notice>
        La page admin est verrouillée tant que la variable <code className="text-bone">ADMIN_PASSWORD</code> (10 caractères
        minimum) n&apos;est pas définie dans les réglages Vercel du projet.
      </Notice>
    );

  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  if (!safeEqual(token, adminToken())) {
    const { erreur } = await searchParams;
    return (
      <form action={login} className="mt-10 max-w-sm">
        <label className="label text-mist" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-3 w-full border border-hairline bg-asphalt px-4 py-3 text-bone outline-none focus:border-bone/50"
        />
        {erreur && <p className="mt-3 text-sm text-signal">Mot de passe incorrect.</p>}
        <button className="mt-5 bg-bone px-6 py-3 text-sm font-medium text-ink hover:bg-mist">Entrer →</button>
      </form>
    );
  }

  if (!dbConfigured()) return <Notice>La base de données n&apos;est pas encore branchée au projet sur Vercel.</Notice>;

  const { testers, feedback } = await adminData();
  const withFeedback = testers.filter((t) => t.feedback_count > 0).length;
  const followed = feedback.filter((f) => f.sessions_planned > 0);
  const followRate = followed.length
    ? Math.round((followed.reduce((a, f) => a + f.sessions_done / f.sessions_planned, 0) / followed.length) * 100)
    : null;
  const week2 = new Set(feedback.filter((f) => f.week >= 2 && f.sessions_done > 0).map((f) => f.email)).size;
  const pains = feedback.filter((f) => f.pain).length;

  return (
    <div className="mt-10">
      <div className="grid grid-cols-2 gap-px border border-hairline bg-hairline md:grid-cols-4">
        <Stat label="Plans créés" value={testers.length} sub={`${testers.filter((t) => t.consent_news).length} acceptent les nouvelles`} />
        <Stat label="Ont donné un retour" value={withFeedback} sub={testers.length ? `${Math.round((withFeedback / testers.length) * 100)} % des inscrits` : undefined} />
        <Stat label="Séances faites" value={followRate === null ? "—" : `${followRate} %`} sub="moyenne des retours" />
        <Stat label="Actifs en semaine 2+" value={week2} sub={pains ? `${pains} retour(s) avec douleur` : "aucune douleur signalée"} />
      </div>

      {/* Téléchargement de fichier : un lien classique, pas une navigation de page. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/admin/export"
        download
        className="mt-8 inline-flex items-center gap-3 border border-hairline px-5 py-3 text-sm text-bone transition hover:border-bone/50"
      >
        Télécharger tout en Excel (.xlsx) <span>↓</span>
      </a>

      <h2 className="serif mt-16 text-4xl">Retours</h2>
      <div className="mt-5 overflow-x-auto border border-hairline">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="label text-fog">
            <tr className="border-b border-hairline">
              {["Date", "Testeur", "Sem.", "Séances", "Ressenti", "Douleur", "Commentaire"].map((h) => (
                <th key={h} className="px-4 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {feedback.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-fog">
                  Pas encore de retour.
                </td>
              </tr>
            )}
            {feedback.map((f, i) => (
              <tr key={i} className="border-b border-hairline align-top last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-fog">{fmt(f.created_at)}</td>
                <td className="px-4 py-3">
                  {f.first_name}
                  <span className="block text-xs text-fog">{f.email}</span>
                </td>
                <td className="px-4 py-3">{f.week}</td>
                <td className="px-4 py-3 font-mono">
                  {f.sessions_done}/{f.sessions_planned}
                </td>
                <td className={`px-4 py-3 ${f.feeling === "ok" ? "" : "text-signal"}`}>{FEELING_LABEL[f.feeling] ?? f.feeling}</td>
                <td className="px-4 py-3">{f.pain ? <span className="text-signal">Oui</span> : "—"}</td>
                <td className="max-w-xs px-4 py-3 text-mist">{f.comment ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="serif mt-16 text-4xl">Inscrits</h2>
      <div className="mt-5 overflow-x-auto border border-hairline">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="label text-fog">
            <tr className="border-b border-hairline">
              {["Date", "Testeur", "Langue", "Objectif", "Niveau", "Autres sports", "Retours", "IA"].map((h) => (
                <th key={h} className="px-4 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {testers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-fog">
                  Pas encore d&apos;inscrit.
                </td>
              </tr>
            )}
            {testers.map((t) => (
              <tr key={t.id} className="border-b border-hairline align-top last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-fog">{fmt(t.created_at)}</td>
                <td className="px-4 py-3">
                  {t.first_name}
                  <span className="block text-xs text-fog">
                    {t.email}
                    {t.consent_news ? " · nouvelles ✓" : ""}
                  </span>
                </td>
                <td className="px-4 py-3 uppercase">{t.lang}</td>
                <td className="px-4 py-3">{FR.goals[t.goal as Goal] ?? t.goal}</td>
                <td className="px-4 py-3">{FR.levels[t.level as Level] ?? t.level}</td>
                <td className="px-4 py-3 text-mist">
                  {t.other_sports ? t.other_sports.split(", ").map((x) => FR.sports[x as SportKey] ?? x).join(", ") : "—"}
                </td>
                <td className="px-4 py-3 font-mono">{t.feedback_count}</td>
                <td className="px-4 py-3">{t.ai ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={logout} className="mt-10">
        <button className="label text-fog hover:text-bone">Se déconnecter</button>
      </form>
    </div>
  );
}

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <Logo />
        <p className="label mt-14 text-signal">Espace privé</p>
        <h1 className="serif mt-3 text-6xl leading-none">Tableau de bord</h1>
        <Suspense fallback={<p className="mt-10 text-fog">Chargement…</p>}>
          <AdminContent searchParams={searchParams as Promise<{ erreur?: string }>} />
        </Suspense>
      </div>
    </main>
  );
}
