"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { MotionRunner } from "@/components/MotionRunner";
import { loadPlanRaw } from "@/lib/storage";
import { WeekFeedback } from "./WeekFeedback";
import type { Locale } from "@/i18n/config";
import { UI_TEXT, type UI } from "@/i18n/ui";
import { LABELS, sportLabel } from "@/lib/labels";
import type { Plan, Session, SessionKind } from "@/lib/types";

const KIND_STYLE: Record<SessionKind, { dot: string; label: "run" | "key" | "strength" }> = {
  facile: { dot: "bg-bone", label: "run" },
  "marche-course": { dot: "bg-bone", label: "run" },
  longue: { dot: "bg-bone", label: "run" },
  qualite: { dot: "bg-signal", label: "key" },
  renfo: { dot: "bg-klein", label: "strength" },
};

function SessionCard({ s, t }: { s: Session; t: UI["plan"] }) {
  const style = KIND_STYLE[s.kind];
  return (
    <div className="print-break border border-hairline bg-asphalt/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label flex items-center gap-2 text-fog">
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {t.kinds[style.label]}
          </p>
          <h4 className="serif mt-2 text-3xl leading-none">{s.title}</h4>
        </div>
        <span className="shrink-0 font-mono text-sm text-mist">{s.minutes}′</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-mist/75">{s.description}</p>
      {s.steps && (
        <ol className="mt-4 space-y-2 text-sm">
          {s.steps.map((st, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-mono text-xs leading-5 text-fog">{String(i + 1).padStart(2, "0")}</span>
              <span>{st}</span>
            </li>
          ))}
        </ol>
      )}
      {s.exercises && (
        <ul className="mt-4 border-t border-hairline text-sm">
          {s.exercises.map((e) => (
            <li key={e.name} className="flex justify-between gap-4 border-b border-hairline py-2.5">
              <span>
                {e.name}
                {e.cue && <span className="block text-xs text-fog">{e.cue}</span>}
              </span>
              <span className="shrink-0 font-mono text-xs text-mist">{e.dose}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="label mt-4 text-fog/80">
        {t.effort} · {s.effort}
      </p>
      {s.coachNote && (
        <p className="mt-4 border-l-2 border-signal pl-3 text-sm leading-relaxed text-mist">
          <em className="serif text-base">{t.coach}</em>
          {s.coachNote}
        </p>
      )}
    </div>
  );
}

export function PlanView({ lang }: { lang: Locale }) {
  const t = UI_TEXT[lang].plan;
  const L = LABELS[lang];
  const raw = useSyncExternalStore(
    () => () => {},
    () => loadPlanRaw(),
    () => undefined,
  );
  const plan = useMemo<Plan | null | undefined>(() => {
    if (raw === undefined) return undefined;
    try {
      return raw ? (JSON.parse(raw) as Plan) : null;
    } catch {
      return null;
    }
  }, [raw]);
  const [week, setWeek] = useState(0);

  if (plan === undefined) return null;
  if (plan === null)
    return (
      <div className="py-32 text-center">
        <p className="serif text-5xl">{t.none}</p>
        <Link href={`/${lang}/create`} className="mt-10 inline-flex items-center gap-6 bg-bone px-7 py-4 text-sm font-medium text-ink">
          {t.create} <span>→</span>
        </Link>
      </div>
    );

  return (
    <div>
      <header className="relative overflow-hidden border-b border-hairline pb-12">
        <div className="pointer-events-none absolute -right-10 bottom-0 w-64 opacity-40 sm:w-96">
          <MotionRunner color="#1f35d6" blur={8} ghosts={3} />
        </div>
        <p className="label text-signal">{plan.goalLabel}</p>
        <h1 className="serif relative mt-5 text-6xl leading-[0.95] sm:text-8xl">
          {t.title}
          <em className="motion-text">{plan.firstName}.</em>
        </h1>
        <p className="relative mt-6 max-w-xl leading-relaxed text-mist/80">{plan.intro}</p>
        {plan.lang && plan.lang !== lang && <p className="relative mt-3 text-sm text-signal">{t.otherLang}</p>}
        <div className="no-print relative mt-8 flex flex-wrap gap-3">
          <button onClick={() => window.print()} className="bg-bone px-5 py-3 text-sm font-medium text-ink hover:bg-white">
            {t.print}
          </button>
          <Link href={`/${lang}/create`} className="border border-hairline px-5 py-3 text-sm text-mist hover:border-bone/50">
            {t.redo}
          </Link>
        </div>
      </header>

      <div className="no-print sticky top-0 z-10 -mx-4 bg-night/90 px-4 backdrop-blur sm:mx-0 sm:px-0">
        <div className="flex overflow-x-auto border-b border-hairline">
          {plan.weeks.map((wk, i) => (
            <button
              key={wk.index}
              onClick={() => setWeek(i)}
              className={`label shrink-0 border-b-2 px-4 py-4 transition ${
                i === week ? "border-signal text-bone" : "border-transparent text-fog hover:text-mist"
              }`}
            >
              {t.weekTab(wk.index)}
            </button>
          ))}
        </div>
      </div>

      {plan.weeks.map((wk, i) => (
        <section key={wk.index} className={`${i === week ? "" : "hidden print:block"} mt-10`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="serif text-5xl leading-none">{wk.label}</h2>
              <p className="mt-3 text-mist/70">{wk.focus}</p>
            </div>
            <p className="label text-fog">{t.runTotal(wk.runMinutes)}</p>
          </div>
          <div className="mt-8 border-t border-hairline">
            {wk.days.map((d) => (
              <div key={d.day} className="grid gap-3 border-b border-hairline py-5 sm:grid-cols-[130px_1fr]">
                <p className="label pt-1 text-mist">{L.days[d.day]}</p>
                <div className="space-y-3">
                  {d.otherSports.map((o, j) => (
                    <div key={j} className="flex items-center justify-between border border-dashed border-bone/20 px-4 py-3 text-sm">
                      <span>
                        <em className="serif text-xl">{sportLabel(lang, o.sport)}</em> <span className="label ml-2 text-fog">{t.yourSport}</span>
                      </span>
                      <span className="font-mono text-xs text-fog">{o.minutes}′</span>
                    </div>
                  ))}
                  {d.sessions.map((s) => (
                    <SessionCard key={s.id} s={s} t={t} />
                  ))}
                  {d.sessions.length === 0 && d.otherSports.length === 0 && (
                    <p className="pt-0.5 text-sm italic text-fog">{t.rest}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {plan.testerId && <WeekFeedback key={`${plan.testerId}-${wk.index}`} testerId={plan.testerId} week={wk} lang={lang} />}
        </section>
      ))}

      <section className="mt-16 grid gap-px border border-hairline bg-hairline md:grid-cols-2">
        <div className="bg-night p-6">
          <p className="label text-fog">{t.tips}</p>
          <ul className="mt-5 space-y-4 text-sm leading-relaxed">
            {plan.tips.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-xs leading-5 text-signal">{String(i + 1).padStart(2, "0")}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-night p-6">
          <p className="label text-fog">{t.know}</p>
          <ul className="mt-5 space-y-4 text-sm leading-relaxed text-mist/80">
            {plan.warnings.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <p className="no-print label mt-12 text-center text-fog">
        {t.soon}
      </p>
    </div>
  );
}
