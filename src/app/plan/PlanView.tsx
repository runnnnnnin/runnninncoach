"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { MotionRunner } from "@/components/MotionRunner";
import { loadPlanRaw } from "@/lib/storage";
import { WeekFeedback } from "./WeekFeedback";
import { DAY_LABELS, type Plan, type Session, type SessionKind } from "@/lib/types";

const KIND_STYLE: Record<SessionKind, { dot: string; label: string }> = {
  facile: { dot: "bg-bone", label: "Course" },
  "marche-course": { dot: "bg-bone", label: "Course" },
  longue: { dot: "bg-bone", label: "Course" },
  qualite: { dot: "bg-signal", label: "Séance clé" },
  renfo: { dot: "bg-klein", label: "Renfo" },
};

function SessionCard({ s }: { s: Session }) {
  const style = KIND_STYLE[s.kind];
  return (
    <div className="print-break border border-hairline bg-asphalt/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label flex items-center gap-2 text-fog">
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {style.label}
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
      <p className="label mt-4 text-fog/80">Effort · {s.effort}</p>
      {s.coachNote && (
        <p className="mt-4 border-l-2 border-signal pl-3 text-sm leading-relaxed text-mist">
          <em className="serif text-base">Coach — </em>
          {s.coachNote}
        </p>
      )}
    </div>
  );
}

export function PlanView() {
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
        <p className="serif text-5xl">Pas encore de plan.</p>
        <Link href="/commencer" className="mt-10 inline-flex items-center gap-6 bg-bone px-7 py-4 text-sm font-medium text-ink">
          Créer mon plan <span>→</span>
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
          Ton plan, <em className="motion-text">{plan.firstName}.</em>
        </h1>
        <p className="relative mt-6 max-w-xl leading-relaxed text-mist/80">{plan.intro}</p>
        <div className="no-print relative mt-8 flex flex-wrap gap-3">
          <button onClick={() => window.print()} className="bg-bone px-5 py-3 text-sm font-medium text-ink hover:bg-white">
            Imprimer / PDF
          </button>
          <Link href="/commencer" className="border border-hairline px-5 py-3 text-sm text-mist hover:border-bone/50">
            Refaire le questionnaire
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
              Sem. {String(wk.index).padStart(2, "0")}
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
            <p className="label text-fog">{wk.runMinutes} min de course</p>
          </div>
          <div className="mt-8 border-t border-hairline">
            {wk.days.map((d) => (
              <div key={d.day} className="grid gap-3 border-b border-hairline py-5 sm:grid-cols-[130px_1fr]">
                <p className="label pt-1 text-mist">{DAY_LABELS[d.day]}</p>
                <div className="space-y-3">
                  {d.otherSports.map((o, j) => (
                    <div key={j} className="flex items-center justify-between border border-dashed border-bone/20 px-4 py-3 text-sm">
                      <span>
                        <em className="serif text-xl">{o.sport}</em> <span className="label ml-2 text-fog">ton sport</span>
                      </span>
                      <span className="font-mono text-xs text-fog">{o.minutes}′</span>
                    </div>
                  ))}
                  {d.sessions.map((s) => (
                    <SessionCard key={s.id} s={s} />
                  ))}
                  {d.sessions.length === 0 && d.otherSports.length === 0 && (
                    <p className="pt-0.5 text-sm italic text-fog">Repos. Marche, mobilité ou rien du tout.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {plan.testerId && <WeekFeedback key={`${plan.testerId}-${wk.index}`} testerId={plan.testerId} week={wk} />}
        </section>
      ))}

      <section className="mt-16 grid gap-px border border-hairline bg-hairline md:grid-cols-2">
        <div className="bg-night p-6">
          <p className="label text-fog">Les conseils du coach</p>
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
          <p className="label text-fog">À savoir</p>
          <ul className="mt-5 space-y-4 text-sm leading-relaxed text-mist/80">
            {plan.warnings.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <p className="no-print label mt-12 text-center text-fog">
        Bientôt · ton plan s&apos;ajustera chaque semaine selon tes retours
      </p>
    </div>
  );
}
