"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import type { Me } from "@/components/AccountLink";
import { savePlan } from "@/lib/storage";
import type { Plan } from "@/lib/types";

type Summary = {
  id: string;
  created_at: string;
  goal_label: string;
  lang: string;
  total: number;
  done: number;
  access: string | null;
  total_weeks: number | null;
};
type Data = Me & { plans?: Summary[] };

/** « Mes plans » : la liste des plans du compte, avec la progression de chacun. */
export function MyPlans({ lang }: { lang: Locale }) {
  const t = UI_TEXT[lang].account;
  const ts = UI_TEXT[lang].strava;
  const tb = UI_TEXT[lang].billing;
  const router = useRouter();
  // Retour de paiement : ?paid=plan|coach|pending, ou ?unlocked=<plan> (le plan est alors ouvert directement).
  const [paid, setPaid] = useState<string | null>(null);
  const [data, setData] = useState<Data | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  // Message au retour de Strava (?strava=connected, denied…).
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("strava");
    if (!code) return;
    window.history.replaceState(null, "", window.location.pathname);
    Promise.resolve().then(() => setNotice(code));
  }, []);

  const load = useCallback(
    () =>
      fetch("/api/me")
        .then((r) => r.json())
        .then((d: Data) => {
          if (!d.user) router.replace(`/${lang}/login`);
          else setData(d);
        })
        .catch(() => router.replace(`/${lang}/login`)),
    [lang, router],
  );
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const unlocked = q.get("unlocked");
    const code = q.get("paid");
    if (!unlocked && !code) return;
    window.history.replaceState(null, "", window.location.pathname);
    if (unlocked && /^[0-9a-f-]{36}$/.test(unlocked)) void open(unlocked);
    else Promise.resolve().then(() => setPaid(code));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function portal() {
    setBusy("portal");
    const res = await fetch("/api/billing/portal", { method: "POST", body: JSON.stringify({ lang }) }).catch(() => null);
    const d = res ? ((await res.json().catch(() => ({}))) as { url?: string }) : {};
    if (d.url) window.location.assign(d.url);
    else setBusy(null);
  }

  async function open(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/plans/${id}`);
      if (!res.ok) throw new Error();
      savePlan((await res.json()) as Plan);
      router.push(`/${lang}/plan`);
    } catch {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t.removeConfirm)) return;
    setBusy(id);
    await fetch(`/api/plans/${id}`, { method: "DELETE" }).catch(() => {});
    await load();
    setBusy(null);
  }

  async function disconnectStrava() {
    if (!window.confirm(ts.disconnectConfirm)) return;
    await fetch("/api/strava/disconnect", { method: "POST" }).catch(() => {});
    setNotice(null);
    await load();
  }

  async function logout() {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }).catch(() => {});
    router.push(`/${lang}`);
  }

  async function deleteAccount() {
    if (!window.confirm(t.deleteConfirm)) return;
    await fetch("/api/me", { method: "DELETE" }).catch(() => {});
    router.push(`/${lang}`);
  }

  if (!data?.user) return null;
  const plans = data.plans ?? [];
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <p className="label text-fog">{t.hello(data.user.firstName || data.user.email)}</p>
      <h1 className="serif lowercase mt-4 text-6xl leading-none sm:text-7xl">
        {t.plansTitle}
        <em className="motion-text">{t.plansTitleEm}</em>
      </h1>

      {paid && tb.paid[paid] && (
        <p role="status" className="mt-8 border-l-2 border-signal pl-3 text-sm text-bone">
          {tb.paid[paid]}
        </p>
      )}

      <div className="mt-10 border-t border-hairline">
        {plans.length === 0 && <p className="border-b border-hairline py-8 text-mist/75">{t.empty}</p>}
        {plans.map((p) => {
          const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
          return (
            <div key={p.id} className="border-b border-hairline py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="serif text-3xl leading-tight">{p.goal_label}</h2>
                  <p className="label mt-2 text-fog">
                    {t.created(date(p.created_at))}
                    {p.access === "free" && p.total_weeks ? (
                      <>
                        {" · "}
                        <Link href={`/${lang}/pricing?plan=${p.id}`} className="text-signal hover:text-bone">
                          {tb.freeTag(p.total_weeks)} · {tb.unlock} →
                        </Link>
                      </>
                    ) : p.access === "full" ? (
                      ` · ${tb.fullTag}`
                    ) : null}
                  </p>
                </div>
                <button
                  onClick={() => open(p.id)}
                  disabled={busy === p.id}
                  className="bg-bone px-5 py-3 text-sm font-medium text-ink hover:bg-mist disabled:opacity-60"
                >
                  {t.open}
                </button>
              </div>
              <div className="mt-5 h-1 w-full bg-hairline" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-1 bg-signal" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-mist">{t.progress(p.done, p.total)}</span>
                <button onClick={() => remove(p.id)} className="label text-fog hover:text-signal">
                  {t.remove}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Link href={`/${lang}/create`} className="mt-10 inline-flex items-center gap-6 bg-klein px-7 py-4 text-sm font-medium text-bone hover:brightness-110">
        {t.create} <span>→</span>
      </Link>

      {data.billing?.available && (
        <section className="mt-16">
          <h2 className="serif text-4xl leading-none">{tb.sectionTitle}</h2>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-hairline py-4">
            <span className="text-sm text-mist">
              {data.billing.coach
                ? data.billing.cancelAtEnd && data.billing.coachUntil
                  ? tb.coachEnds(date(data.billing.coachUntil))
                  : tb.coachOn(data.billing.coachUntil ? date(data.billing.coachUntil) : null)
                : data.billing.credits > 0
                  ? tb.credits(data.billing.credits)
                  : tb.noneLine}
            </span>
            {data.billing.customer && (data.billing.coach || data.billing.coachUntil) ? (
              <button onClick={portal} disabled={busy === "portal"} className="label border-b border-bone/50 pb-1 text-bone hover:border-bone disabled:opacity-60">
                {tb.manage}
              </button>
            ) : (
              <Link href={`/${lang}/pricing`} className="label border-b border-bone/50 pb-1 text-bone hover:border-bone">
                {tb.seeOffers}
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="mt-16">
        <h2 className="serif text-4xl leading-none">{ts.connections}</h2>
        <p className="mt-3 text-sm text-mist/75">{ts.connectionsSub}</p>
        {notice && ts.msg[notice] && (
          <p role="status" className={`mt-5 border-l-2 pl-3 text-sm ${notice === "connected" ? "border-bone text-bone" : "border-signal text-signal"}`}>
            {ts.msg[notice]}
          </p>
        )}
        <ul className="mt-6 border-t border-hairline">
          <li className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline py-4">
            <span className="serif text-2xl">Strava</span>
            {!data.strava?.available ? (
              <span className="label text-fog">{ts.soon}</span>
            ) : data.strava.connected ? (
              <span className="flex items-center gap-5">
                <span className="label flex items-center gap-2 text-bone">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                  {ts.connected}
                </span>
                <button onClick={disconnectStrava} className="label text-fog hover:text-signal">
                  {ts.disconnect}
                </button>
              </span>
            ) : (
              <a href={`/api/strava/connect?lang=${lang}`} className="px-5 py-3 text-sm font-medium text-white hover:brightness-110" style={{ background: "#fc4c02" }}>
                {ts.connect}
              </a>
            )}
          </li>
          {["Garmin", "Coros"].map((name) => (
            <li key={name} className="flex items-center justify-between gap-4 border-b border-hairline py-4">
              <span className="serif text-2xl text-fog">{name}</span>
              <span className="label text-fog">{ts.soon}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16 flex flex-wrap gap-6 border-t border-hairline pt-6">
        <button onClick={logout} className="label text-mist hover:text-bone">
          {t.logout}
        </button>
        <button onClick={deleteAccount} className="label text-fog hover:text-signal">
          {t.deleteAccount}
        </button>
      </div>
    </div>
  );
}
