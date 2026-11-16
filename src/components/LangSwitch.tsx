"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, type Locale } from "@/i18n/config";

/** Bouton EN / FR : garde la même page, change seulement la langue. */
export function LangSwitch({ lang }: { lang: Locale }) {
  const pathname = usePathname() ?? `/${lang}`;
  const rest = pathname.replace(/^\/(en|fr)(?=\/|$)/, "");
  return (
    <div className="label flex items-center gap-1.5 text-fog" aria-label="Language">
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-fog/40">/</span>}
          {l === lang ? (
            <span className="text-bone" aria-current="true">
              {l.toUpperCase()}
            </span>
          ) : (
            <Link href={`/${l}${rest}`} hrefLang={l} className="transition hover:text-bone">
              {l.toUpperCase()}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
