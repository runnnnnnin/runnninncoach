"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useMe } from "@/components/AccountLink";
import { MotionRunner } from "@/components/MotionRunner";
import { loadPlanRaw } from "@/lib/storage";
import { computeProgress, loadDone, saveDone, type Done } from "@/lib/progress";
import { CalendarExport } from "./CalendarExport";
import { ExerciseRow } from "./ExerciseGuide";
import { ProgressPanel } from "./ProgressPanel";
import { StravaSync, type Details } from "./StravaSync";
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

/** 38:12 et 6:10/km à partir d'une durée et d'une distance. */
function stravaLine(d: { km: number; sec: number }) {
  const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
  const parts = [d.km > 0 ? `${d.km.toFixed(1)} km` : null, clock(d.sec), d.km > 0.2 ? `${clock(d.sec / d.km)}/km` : null];
  return parts.filter(Boolean).join(" · ");
}

function SessionCard({
  s,
  t,
  tp,
  done,
  onToggle,
  detail,
  via,
  lang,
}: {
  s: Session;
  t: UI["plan"];
  tp: UI["prog"];
  done: boolean;
  onToggle: () => void;
  detail?: { km: number; sec: number };
  via: string;
  lang: Locale;
}) {
  const style = KIND_STYLE[s.kind];
  return (
    <div className={`print-break border bg-asphalt/70 p-5 transition ${done ? "border-bone/40" : "border-hairline"}`}>
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
            <ExerciseRow key={e.name} e={e} lang={lang} />
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
      <button
        onClick={onToggle}
        aria-pressed={done}
        className={`no-print mt-5 inline-flex items-center gap-3 border px-4 py-2.5 text-sm transition ${
          done ? "border-bone bg-bone text-ink" : "border-hairline text-mist hover:border-bone/60 hover:text-bone"
        }`}
      >
        <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] leading-none ${done ? "border-ink" : "border-fog"}`}>
          {done ? "✓" : ""}
        </span>
        {done ? tp.marked : tp.mark}
      </button>
      {done && detail && (
        <p className="no-print mt-3 font-mono text-xs text-mist">
          <span style={{ color: "#fc4c02" }}>{via}</span> · {stravaLine(detail)}
        </p>
      )}
    </div>
  );
}

export function PlanView({ lang }: { lang: Locale }) {
  const t = UI_TEXT[lang].plan;
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

  return <PlanBody key={plan.testerId ?? plan.createdAt} plan={plan} lang={lang} />;
}

function PlanBody({ plan, lang }: { plan: Plan; lang: Locale }) {
  const t = UI_TEXT[lang].plan;
  const ta = UI_TEXT[lang].account;
  const tp = UI_TEXT[lang].prog;
  const ts = UI_TEXT[lang].strava;
  const L = LABELS[lang];
  const me = useMe();
  const [week, setWeek] = useState(0);

  // Séances cochées : gardées dans le navigateur, et sur le serveur quand le plan y est enregistré.
  const planKey = plan.testerId ?? plan.createdAt;
  const [done, setDone] = useState<Done>({});
  const [details, setDetails] = useState<Details>({});
  const [start, setStart] = useState<string | null | undefined>(undefined);
  const [fresh, setFresh] = useState<string | null>(null);
  const freshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      let merged = loadDone(planKey);
      if (plan.testerId) {
        const remote = await fetch(`/api/progress?plan=${plan.testerId}`)
          .then((r) => (r.ok ? (r.json() as Promise<{ done: Done; details?: Details; start?: string | null }>) : null))
          .catch(() => null);
        if (!alive) return;
        if (remote) {
          merged = remote.done;
          setDetails(remote.details ?? {});
        }
        setStart(remote?.start ?? null);
      } else await Promise.resolve();
      if (!alive) return;
      setDone(merged);
      saveDone(planKey, merged);
    })();
    return () => {
      alive = false;
    };
  }, [planKey, plan.testerId]);
  const progress = useMemo(() => computeProgress(plan, done), [plan, done]);

  function toggle(id: string) {
    const next = { ...done };
    if (next[id]) delete next[id];
    else next[id] = new Date().toISOString();
    setDone(next);
    saveDone(planKey, next);
    // Un badge vient d'être gagné ? On le met en avant quelques secondes.
    const before = new Set(progress.badges.filter((b) => b.earned).map((b) => b.key));
    const won = computeProgress(plan, next).badges.filter((b) => b.earned && !before.has(b.key)).pop();
    if (won) {
      setFresh(won.key);
      if (freshTimer.current) clearTimeout(freshTimer.current);
      freshTimer.current = setTimeout(() => setFresh(null), 5000);
    }
    if (plan.testerId)
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.testerId, session: id, done: Boolean(next[id]) }),
      }).catch(() => {});
  }

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

      {me?.user === null && plan.testerId && (
        <div className="no-print mt-8 flex flex-wrap items-center justify-between gap-4 border border-klein/60 bg-klein/10 px-5 py-4">
          <p className="text-sm text-mist">{ta.saveBanner}</p>
          <Link href={`/${lang}/signup`} className="label border-b border-bone/50 pb-1 text-bone hover:border-bone">
            {ta.saveCta}
          </Link>
        </div>
      )}

      <ProgressPanel p={progress} lang={lang} fresh={fresh} />

      {me?.strava?.connected && plan.testerId && start !== undefined && (
        <StravaSync
          planId={plan.testerId}
          lang={lang}
          start={start}
          onSynced={(r) => {
            setDone(r.done);
            saveDone(planKey, r.done);
            setDetails(r.details);
            setStart(r.start);
          }}
        />
      )}

      <CalendarExport plan={plan} lang={lang} />

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
              <span className="ml-2 font-mono text-[10px] text-fog">
                {progress.weeks[i].done}/{progress.weeks[i].total}
              </span>
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
                    <SessionCard key={s.id} s={s} t={t} tp={tp} done={Boolean(done[s.id])} onToggle={() => toggle(s.id)} detail={details[s.id]} via={ts.via} lang={lang} />
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

      <GuideCard lang={lang} />

      <p className="no-print label mt-12 text-center text-fog">
        {t.soon}
      </p>
    </div>
  );
}

/** Encart vers le guide RunFlow (ebook), sous le plan. */
function GuideCard({ lang }: { lang: Locale }) {
  const g = UI_TEXT[lang].guide;
  return (
    <Link
      href={`/${lang}/guide`}
      className="no-print group mt-10 flex items-center gap-5 border border-hairline bg-asphalt p-5 transition hover:border-bone/30 sm:gap-7 sm:p-6"
    >
      <Image src="/guide/cover.jpg" alt="" width={900} height={1273} sizes="6rem" className="h-auto w-16 shrink-0 sm:w-24" />
      <div className="flex-1">
        <p className="label text-fog">{g.planK}</p>
        <p className="serif mt-2 text-2xl leading-tight sm:text-3xl">{g.planT}</p>
        <p className="mt-2 hidden max-w-lg text-sm leading-relaxed text-mist/70 sm:block">{g.planD}</p>
        <p className="mt-3 text-sm text-signal">
          {g.planCta} <span className="inline-block transition group-hover:translate-x-1">→</span>
        </p>
      </div>
    </Link>
  );
}
