"use client";

import type { Locale } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import type { computeProgress } from "@/lib/progress";

/** Série en cours, avancement du plan et badges. */
export function ProgressPanel({ p, lang, fresh }: { p: ReturnType<typeof computeProgress>; lang: Locale; fresh: string | null }) {
  const t = UI_TEXT[lang].prog;
  const pct = p.total ? Math.round((p.count / p.total) * 100) : 0;
  const earned = p.badges.filter((b) => b.earned).length;
  return (
    <section className="no-print mt-10 border border-hairline bg-asphalt/60">
      <div className="grid gap-px bg-hairline sm:grid-cols-[minmax(0,220px)_1fr]">
        <div className="bg-asphalt/95 p-5 sm:p-6">
          <p className="label text-signal">{t.kicker}</p>
          <p className="mt-4 flex items-baseline gap-3">
            <span className={`serif text-7xl leading-none ${p.streak > 0 ? "text-bone" : "text-fog"}`}>{p.streak}</span>
            <span className="label text-mist">{t.streak}</span>
          </p>
          <p className="label mt-3 text-fog">{t.best(p.best)}</p>
        </div>
        <div className="bg-asphalt/95 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm text-mist">{t.done(p.count, p.total)}</p>
            <p className="font-mono text-sm text-bone">{pct}%</p>
          </div>
          <div className="mt-3 h-1.5 w-full bg-hairline" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-1.5 bg-signal transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-6 flex items-baseline justify-between">
            <p className="label text-fog">{t.badges}</p>
            <p className="font-mono text-xs text-fog">{t.earned(earned, p.badges.length)}</p>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {p.badges.map((b) => {
              const txt = t.list[b.key];
              return (
                <li
                  key={b.key}
                  className={`border px-3 py-2.5 transition ${
                    b.earned ? (fresh === b.key ? "border-signal bg-signal/10" : "border-bone/40") : "border-hairline opacity-55"
                  }`}
                >
                  <p className={`serif flex items-center gap-2 text-lg leading-tight ${b.earned ? "text-bone" : "text-fog"}`}>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${b.earned ? "bg-signal" : "border border-fog"}`} />
                    {txt.name}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-fog">{fresh === b.key ? t.newBadge : txt.desc}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
