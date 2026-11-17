"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import type { Access } from "@/lib/billing";

export type Me = {
  user: { email: string; firstName: string | null } | null;
  strava?: { available: boolean; connected: boolean };
  billing?: Access | null;
};

/** Qui est connecté ? `undefined` tant qu'on ne sait pas. */
export function useMe() {
  const [me, setMe] = useState<Me | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: Me) => alive && setMe(d))
      .catch(() => alive && setMe({ user: null }));
    return () => {
      alive = false;
    };
  }, []);
  return me;
}

/** Lien du menu : « Connexion » ou « Mes plans » selon que la personne est connectée. */
export function AccountLink({ lang }: { lang: Locale }) {
  const t = UI_TEXT[lang].account;
  const me = useMe();
  const cls = "label text-fog transition hover:text-bone";
  if (me === undefined) return <span className="label invisible">{t.login}</span>;
  return me.user ? (
    <Link href={`/${lang}/plans`} className={cls}>
      {t.myPlans}
    </Link>
  ) : (
    <Link href={`/${lang}/login`} className={cls}>
      {t.login}
    </Link>
  );
}
