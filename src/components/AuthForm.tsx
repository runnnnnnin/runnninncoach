"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import { BRAND } from "@/lib/brand";
import { loadPlanRaw } from "@/lib/storage";

/** Le plan ouvert dans ce navigateur, s'il est enregistré : il sera rattaché au compte. */
function localPlanId(): string | undefined {
  try {
    return (JSON.parse(loadPlanRaw() ?? "null") as { testerId?: string } | null)?.testerId;
  } catch {
    return undefined;
  }
}

export function AuthForm({ lang, mode }: { lang: Locale; mode: "login" | "signup" }) {
  const t = UI_TEXT[lang].account;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, email, password, ...(signup && firstName ? { firstName } : {}), claim: localPlanId() }),
      });
      if (!res.ok) {
        const code = ((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "unavailable";
        setError(t.errors[code] ?? t.errors.unavailable);
        setBusy(false);
        return;
      }
      // ?next=/fr/pricing… : on revient là où la personne était (adresses du site uniquement).
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && /^\/(en|fr)\/[\w\-/?=&%.]*$/.test(next) && !next.startsWith("//") ? next : `/${lang}/plans`);
    } catch {
      setError(t.errors.unavailable);
      setBusy(false);
    }
  }

  const input = "mt-2 w-full border border-hairline bg-asphalt px-4 py-3 text-bone outline-none focus:border-bone/60";
  return (
    <div>
      <h1 className="serif lowercase text-5xl leading-none sm:text-6xl">
        {signup ? t.signupTitle : t.loginTitle}
        <em className="motion-text">{signup ? t.signupTitleEm : t.loginTitleEm}</em>
      </h1>
      {signup && <p className="mt-5 text-mist/75">{t.signupSub}</p>}
      <form onSubmit={submit} className="mt-10 space-y-5">
        {signup && (
          <label className="block">
            <span className="label text-fog">{t.firstName}</span>
            <input className={input} value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={40} autoComplete="given-name" />
          </label>
        )}
        <label className="block">
          <span className="label text-fog">{t.email}</span>
          <input className={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="block">
          <span className="label text-fog">{t.password}</span>
          <input
            className={input}
            type="password"
            required
            minLength={signup ? 8 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? "new-password" : "current-password"}
          />
          {signup && <span className="mt-2 block text-xs text-fog">{t.passwordHint}</span>}
        </label>
        {error && (
          <p role="alert" className="border-l-2 border-signal pl-3 text-sm text-signal">
            {error}
          </p>
        )}
        <button disabled={busy} className="w-full bg-bone px-6 py-4 text-sm font-medium text-ink hover:bg-mist disabled:opacity-60 sm:w-auto">
          {busy ? t.sending : signup ? t.submitSignup : t.submitLogin}
        </button>
      </form>
      <p className="mt-8 text-sm">
        <Link href={`/${lang}/${signup ? "login" : "signup"}`} className="border-b border-bone/40 pb-0.5 text-mist hover:text-bone">
          {signup ? t.toLogin : t.toSignup}
        </Link>
      </p>
      {!signup && (
        <p className="mt-4 text-xs text-fog">
          {t.noReset}{" "}
          {BRAND.contactEmail && (
            <a className="underline hover:text-bone" href={`mailto:${BRAND.contactEmail}`}>
              {BRAND.contactEmail}
            </a>
          )}
        </p>
      )}
    </div>
  );
}
