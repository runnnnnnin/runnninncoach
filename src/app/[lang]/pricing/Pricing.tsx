"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMe } from "@/components/AccountLink";
import type { Locale } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import { EBOOK, OFFERS } from "@/lib/brand";
import { savePlan } from "@/lib/storage";
import type { Plan } from "@/lib/types";

type Kind = "plan" | "coach";

/** Les trois offres, la case de renonciation au droit de rétractation et les boutons de paiement. */
export function Pricing({ lang }: { lang: Locale }) {
  const t = UI_TEXT[lang].billing;
  const me = useMe();
  const router = useRouter();
  const [planId, setPlanId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<Kind | "unlock" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ?plan=… : le plan gratuit que la personne veut débloquer.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("plan");
    if (id && /^[0-9a-f-]{36}$/.test(id)) Promise.resolve().then(() => setPlanId(id));
  }, []);

  const billing = me?.billing;
  const loggedIn = Boolean(me?.user);
  const here = `/${lang}/pricing${planId ? `?plan=${planId}` : ""}`;
  const date = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

  async function pay(kind: Kind) {
    setError(null);
    if (!consent) return setError(t.needConsent);
    setBusy(kind);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, lang, consent: true, ...(planId ? { plan: planId } : {}) }),
      });
      const d = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (d.url) return void window.location.assign(d.url);
      if (d.error === "login") return void router.push(`/${lang}/signup?next=${encodeURIComponent(here)}`);
      setError(t.errors[d.error as keyof typeof t.errors] ?? t.errors.generic);
    } catch {
      setError(t.errors.generic);
    }
    setBusy(null);
  }

  async function unlock() {
    if (!planId) return;
    setBusy("unlock");
    setError(null);
    const res = await fetch(`/api/plans/${planId}/unlock`, { method: "POST" }).catch(() => null);
    if (res?.ok) {
      savePlan((await res.json()) as Plan);
      return void router.push(`/${lang}/plan`);
    }
    setError(t.errors.generic);
    setBusy(null);
  }

  async function portal() {
    setBusy("portal");
    const res = await fetch("/api/billing/portal", { method: "POST", body: JSON.stringify({ lang }) }).catch(() => null);
    const d = res ? ((await res.json().catch(() => ({}))) as { url?: string }) : {};
    if (d.url) return void window.location.assign(d.url);
    setError(t.errors.stripe);
    setBusy(null);
  }

  const canUnlockNow = Boolean(planId && billing && (billing.coach || billing.credits > 0));
  const paymentsOpen = billing === undefined || billing === null || billing.available;

  return (
    <div className="pb-24">
      {/* Ce que la personne a déjà */}
      {billing?.coach && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border border-bone/30 bg-asphalt px-5 py-4 text-sm text-bone">
          <span>{billing.cancelAtEnd && billing.coachUntil ? t.coachEnds(date(billing.coachUntil)!) : t.coachOn(date(billing.coachUntil))}</span>
          <button onClick={portal} disabled={busy !== null} className="label border-b border-bone/50 pb-1 hover:border-bone disabled:opacity-60">
            {t.manage}
          </button>
        </div>
      )}
      {!billing?.coach && (billing?.credits ?? 0) > 0 && (
        <p className="mb-8 border border-bone/30 bg-asphalt px-5 py-4 text-sm text-bone">{t.credits(billing!.credits)}</p>
      )}
      {canUnlockNow && (
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border border-signal/60 bg-signal/10 px-5 py-4">
          <span className="text-sm text-bone">{t.forPlan}</span>
          <button onClick={unlock} disabled={busy !== null} className="bg-signal px-5 py-3 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60">
            {busy === "unlock" ? t.unlocking : t.unlockThis}
          </button>
        </div>
      )}

      <div className="grid gap-px border border-hairline bg-hairline md:grid-cols-3">
        {/* Gratuit */}
        <section className="flex flex-col bg-night p-6 sm:p-8">
          <h2 className="serif text-3xl lowercase">{t.free.name}</h2>
          <p className="mt-4 text-4xl font-medium tracking-tight">€0</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm leading-relaxed text-mist/85">
            {t.free.points.map((x) => (
              <li key={x} className="flex gap-3">
                <span className="text-fog">—</span>
                {x}
              </li>
            ))}
          </ul>
          <Link href={`/${lang}/create`} className="mt-8 border border-hairline px-5 py-3 text-center text-sm text-mist hover:border-bone/50">
            {t.free.cta}
          </Link>
        </section>

        {/* Plan complet */}
        <section className="flex flex-col bg-night p-6 sm:p-8">
          <h2 className="serif text-3xl lowercase">{t.plan.name}</h2>
          <p className="mt-4 text-4xl font-medium tracking-tight">
            {OFFERS.plan.price} <span className="label align-middle text-fog">{t.perOnce}</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3 text-sm leading-relaxed text-mist/85">
            {t.plan.points.map((x) => (
              <li key={x} className="flex gap-3">
                <span className="text-signal">→</span>
                {x}
              </li>
            ))}
          </ul>
          {buyButton("plan", t.plan.cta)}
        </section>

        {/* Coach */}
        <section className="relative flex flex-col bg-asphalt p-6 sm:p-8">
          <span className="label absolute right-6 top-7 text-signal sm:right-8 sm:top-9">{t.best}</span>
          <h2 className="serif text-3xl lowercase">{t.coach.name}</h2>
          <p className="mt-4 text-4xl font-medium tracking-tight">
            {OFFERS.coach.price} <span className="label align-middle text-fog">{t.perMonth}</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3 text-sm leading-relaxed text-mist/85">
            {t.coach.points.map((x) => (
              <li key={x} className="flex gap-3">
                <span className="text-signal">→</span>
                {x}
              </li>
            ))}
          </ul>
          {buyButton("coach", billing?.coach ? t.manage : t.coach.cta, true)}
        </section>
      </div>

      {/* Connexion, consentement, erreurs */}
      <div className="mt-8 max-w-2xl">
        {me && !loggedIn && paymentsOpen && (
          <div className="mb-6 border border-hairline bg-asphalt px-5 py-4 text-sm text-mist">
            {t.loginFirst}
            <div className="mt-3 flex flex-wrap gap-5">
              <Link href={`/${lang}/signup?next=${encodeURIComponent(here)}`} className="label border-b border-bone/50 pb-1 text-bone hover:border-bone">
                {t.signup}
              </Link>
              <Link href={`/${lang}/login?next=${encodeURIComponent(here)}`} className="label pb-1 text-fog hover:text-bone">
                {t.login}
              </Link>
            </div>
          </div>
        )}
        <label className="flex cursor-pointer gap-3 text-sm leading-relaxed text-mist/85">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-signal" />
          <span>
            {t.consent}{" "}
            <Link href={`/${lang}/terms`} className="underline decoration-fog underline-offset-4 hover:text-bone">
              {t.terms}
            </Link>
          </span>
        </label>
        {error && (
          <p role="alert" className="mt-4 border-l-2 border-signal pl-3 text-sm text-signal">
            {error}
          </p>
        )}
      </div>

      <p className="mt-14 text-sm text-fog">
        {t.guideLine} ·{" "}
        <Link href={`/${lang}/guide`} className="text-bone underline decoration-fog underline-offset-4 hover:decoration-bone">
          {EBOOK.price} →
        </Link>
      </p>

      <section className="mt-16 border-t border-hairline pt-12">
        <p className="label text-fog">{t.faqK}</p>
        <dl className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {t.faq.map(([q, a]) => (
            <div key={q}>
              <dt className="text-bone">{q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-mist/75">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );

  function buyButton(kind: Kind, label: string, primary = false) {
    const onClick = kind === "coach" && billing?.coach ? portal : () => pay(kind);
    return (
      <button
        onClick={onClick}
        disabled={busy !== null || !paymentsOpen}
        className={`mt-8 px-5 py-3 text-sm font-medium transition disabled:opacity-50 ${
          primary ? "bg-signal text-white hover:brightness-110" : "bg-bone text-ink hover:bg-mist"
        }`}
      >
        {busy === kind ? "…" : !paymentsOpen ? t.errors.unavailable : label}
      </button>
    );
  }
}
