"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import { LABELS } from "@/lib/labels";
import { savePlan } from "@/lib/storage";
import {
  AGE_KEYS,
  DAYS,
  EQUIPMENT_KEYS,
  GOAL_KEYS,
  INJURY_KEYS,
  LEVEL_KEYS,
  SPORT_KEYS,
  type Day,
  type Goal,
  type Injury,
  type SportKey,
  type Level,
  type OtherSport,
  type Plan,
  type Profile,
} from "@/lib/types";

type Draft = Omit<Profile, "goal" | "level" | "age" | "lang"> & {
  goal?: Goal;
  level?: Level;
  age?: Profile["age"];
  email: string;
  consentNews: boolean;
  website: string;
};

const INITIAL: Draft = {
  firstName: "",
  availableDays: ["mar", "jeu", "dim"],
  runsPerWeek: 3,
  strengthPerWeek: 1,
  maxMinutes: 60,
  otherSports: [],
  equipment: "aucun",
  injuries: [],
  email: "",
  consentNews: false,
  website: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full border px-4 py-4 text-left text-[15px] transition ${
        selected ? "border-bone bg-bone text-ink" : "border-hairline bg-asphalt/60 text-bone hover:border-bone/50"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`border px-4 py-2.5 text-sm transition ${
        selected ? "border-bone bg-bone text-ink" : "border-hairline bg-asphalt/60 text-bone hover:border-bone/50"
      }`}
    >
      {children}
    </button>
  );
}

function Stepper({ value, min, max, onChange, unit, labels }: { value: number; min: number; max: number; onChange: (n: number) => void; unit: string; labels: [string, string] }) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label={labels[0]}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="h-11 w-11 border border-hairline bg-asphalt/60 text-xl text-bone transition hover:border-bone/50 disabled:opacity-25"
      >
        −
      </button>
      <span className="serif min-w-28 text-center text-3xl">
        {value} {unit}
      </span>
      <button
        type="button"
        aria-label={labels[1]}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="h-11 w-11 border border-hairline bg-asphalt/60 text-xl text-bone transition hover:border-bone/50 disabled:opacity-25"
      >
        +
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="label text-mist">{label}</p>
        {hint && <p className="mt-1 text-sm text-fog">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function Questionnaire({ lang }: { lang: Locale }) {
  const t = UI_TEXT[lang].q;
  const L = LABELS[lang];
  const pm: [string, string] = [t.minus, t.plus];
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSport, setNewSport] = useState<OtherSport>({ sport: "football", day: "mar", intensity: "intense", minutes: 90 });

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const toggleDay = (day: Day) =>
    set("availableDays", d.availableDays.includes(day) ? d.availableDays.filter((x) => x !== day) : [...d.availableDays, day]);
  const toggleInjury = (i: Injury) => set("injuries", d.injuries.includes(i) ? d.injuries.filter((x) => x !== i) : [...d.injuries, i]);

  const steps: { title: string; subtitle?: string; valid: boolean; body: ReactNode }[] = [
    {
      title: t.s1.title,
      subtitle: t.s1.sub,
      valid: d.firstName.trim().length > 0 && !!d.age,
      body: (
        <div className="space-y-8">
          <Field label={t.s1.name}>
            <input
              value={d.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              maxLength={40}
              autoFocus
              placeholder={t.s1.namePh}
              className="serif w-full border-b border-hairline bg-transparent py-3 text-4xl text-bone outline-none placeholder:text-fog/40 focus:border-bone"
            />
          </Field>
          <Field label={t.s1.age}>
            <div className="flex flex-wrap gap-2">
              {AGE_KEYS.map((a) => (
                <Chip key={a} selected={d.age === a} onClick={() => set("age", a)}>
                  {L.ages[a]}
                </Chip>
              ))}
            </div>
          </Field>
        </div>
      ),
    },
    {
      title: t.s2.title,
      subtitle: t.s2.sub,
      valid: !!d.goal,
      body: (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {GOAL_KEYS.map((g) => (
            <Choice key={g} selected={d.goal === g} onClick={() => set("goal", g)}>
              {L.goals[g]}
            </Choice>
          ))}
        </div>
      ),
    },
    {
      title: t.s3.title,
      subtitle: t.s3.sub,
      valid: !!d.level,
      body: (
        <div className="grid gap-2.5">
          {LEVEL_KEYS.map((l) => (
            <Choice key={l} selected={d.level === l} onClick={() => set("level", l)}>
              {L.levels[l]}
            </Choice>
          ))}
        </div>
      ),
    },
    {
      title: t.s4.title,
      subtitle: t.s4.sub,
      valid: d.availableDays.length >= 2,
      body: (
        <div className="space-y-8">
          <Field label={t.s4.days} hint={t.s4.daysHint}>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <Chip key={day} selected={d.availableDays.includes(day)} onClick={() => toggleDay(day)}>
                  {L.days[day]}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label={t.s4.runs}>
            <Stepper value={d.runsPerWeek} min={2} max={5} onChange={(n) => set("runsPerWeek", n)} unit={t.s4.runsUnit} labels={pm} />
          </Field>
          <Field label={t.s4.strength} hint={t.s4.strengthHint}>
            <Stepper value={d.strengthPerWeek} min={0} max={3} onChange={(n) => set("strengthPerWeek", n)} unit={t.s4.strengthUnit} labels={pm} />
          </Field>
          <Field label={t.s4.max}>
            <div className="flex flex-wrap gap-2">
              {[30, 45, 60, 75, 90, 120].map((m) => (
                <Chip key={m} selected={d.maxMinutes === m} onClick={() => set("maxMinutes", m)}>
                  {m < 60 ? `${m} min` : lang === "fr" ? `${Math.floor(m / 60)} h${m % 60 ? String(m % 60) : ""}` : `${Math.floor(m / 60)}h${m % 60 ? String(m % 60) : ""}`}
                </Chip>
              ))}
            </div>
          </Field>
        </div>
      ),
    },
    {
      title: t.s5.title,
      subtitle: t.s5.sub,
      valid: true,
      body: (
        <div className="space-y-6">
          {d.otherSports.length > 0 && (
            <ul className="space-y-2">
              {d.otherSports.map((s, i) => (
                <li key={i} className="flex items-center justify-between border border-hairline bg-asphalt/60 px-4 py-3 text-sm">
                  <span>
                    <span className="serif text-lg">{L.sports[s.sport as SportKey] ?? s.sport}</span> · {L.days[s.day]} · {L.intensity[s.intensity].toLowerCase()} · {s.minutes} min
                  </span>
                  <button
                    type="button"
                    onClick={() => set("otherSports", d.otherSports.filter((_, j) => j !== i))}
                    className="label text-fog hover:text-signal"
                  >
                    {t.s5.remove}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-4 border border-dashed border-bone/20 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="label text-fog">{t.s5.sport}</span>
                <select
                  value={newSport.sport}
                  onChange={(e) => setNewSport({ ...newSport, sport: e.target.value })}
                  className="w-full border border-hairline bg-asphalt px-3 py-2.5 text-bone"
                >
                  {SPORT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {L.sports[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="label text-fog">{t.s5.day}</span>
                <select
                  value={newSport.day}
                  onChange={(e) => setNewSport({ ...newSport, day: e.target.value as Day })}
                  className="w-full border border-hairline bg-asphalt px-3 py-2.5 text-bone"
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {L.days[day]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="label text-fog">{t.s5.intensity}</span>
                <select
                  value={newSport.intensity}
                  onChange={(e) => setNewSport({ ...newSport, intensity: e.target.value as OtherSport["intensity"] })}
                  className="w-full border border-hairline bg-asphalt px-3 py-2.5 text-bone"
                >
                  {Object.entries(L.intensity).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="label text-fog">{t.s5.duration}</span>
                <select
                  value={newSport.minutes}
                  onChange={(e) => setNewSport({ ...newSport, minutes: Number(e.target.value) })}
                  className="w-full border border-hairline bg-asphalt px-3 py-2.5 text-bone"
                >
                  {[30, 45, 60, 90, 120, 180].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              disabled={d.otherSports.length >= 6}
              onClick={() => set("otherSports", [...d.otherSports, newSport])}
              className="w-full border border-bone/60 px-5 py-3 text-sm text-bone transition hover:bg-bone hover:text-ink disabled:opacity-30"
            >
              {t.s5.add}
            </button>
          </div>
          {d.otherSports.length === 0 && <p className="text-sm text-fog">{t.s5.none}</p>}
        </div>
      ),
    },
    {
      title: t.s6.title,
      subtitle: t.s6.sub,
      valid: true,
      body: (
        <div className="space-y-8">
          <Field label={t.s6.equipment}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {EQUIPMENT_KEYS.map((e) => (
                <Choice key={e} selected={d.equipment === e} onClick={() => set("equipment", e)}>
                  {L.equipment[e]}
                </Choice>
              ))}
            </div>
          </Field>
          <Field label={t.s6.injuries} hint={t.s6.injuriesHint}>
            <div className="flex flex-wrap gap-2">
              {INJURY_KEYS.map((i) => (
                <Chip key={i} selected={d.injuries.includes(i)} onClick={() => toggleInjury(i)}>
                  {L.injuries[i]}
                </Chip>
              ))}
            </div>
          </Field>
        </div>
      ),
    },
    {
      title: t.s7.title,
      subtitle: t.s7.sub,
      valid: EMAIL_RE.test(d.email.trim()),
      body: (
        <div className="space-y-8">
          <Field label={t.s7.email}>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={d.email}
              onChange={(e) => set("email", e.target.value)}
              maxLength={200}
              placeholder={lang === "fr" ? "toi@exemple.com" : "you@example.com"}
              className="serif w-full border-b border-hairline bg-transparent py-3 text-3xl text-bone outline-none placeholder:text-fog/40 focus:border-bone sm:text-4xl"
            />
          </Field>
          {/* Champ piège invisible pour les robots */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={d.website}
            onChange={(e) => set("website", e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-mist/80">
            <input
              type="checkbox"
              checked={d.consentNews}
              onChange={(e) => set("consentNews", e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--signal)]"
            />
            <span>{t.s7.consent}</span>
          </label>
          <p className="text-xs leading-relaxed text-fog">
            {t.s7.privacy}{" "}
            <a href={`/${lang}/privacy`} target="_blank" className="underline hover:text-bone">
              {t.s7.privacyLink}
            </a>
          </p>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const last = step === steps.length - 1;

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.errorGeneric);
      savePlan(data as Plan);
      router.push(`/${lang}/plan`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorGeneric);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <div className="h-px w-40 overflow-hidden bg-hairline"><div className="h-px w-1/3 animate-[streak_1.2s_ease-in-out_infinite_alternate] bg-bone" /></div>
        <p className="serif mt-10 text-4xl">{t.loadingTitle(d.firstName)}</p>
        <p className="mt-3 text-fog">{t.loadingBody}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="label mb-3 flex justify-between text-fog">
          <span>{t.stepOf(step + 1, steps.length)}</span>
        </div>
        <div className="h-px overflow-hidden bg-hairline">
          <div className="h-full bg-signal transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <h1 className="serif text-5xl leading-none sm:text-6xl">{current.title}</h1>
      {current.subtitle && <p className="mt-4 max-w-lg text-mist/70">{current.subtitle}</p>}
      <div className="mt-10">{current.body}</div>

      {error && <p className="mt-6 border border-signal/40 px-4 py-3 text-sm text-signal">{error}</p>}

      <div className="mt-14 flex items-center justify-between gap-3 border-t border-hairline pt-6">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          className={`label py-3 text-fog hover:text-bone ${step === 0 ? "invisible" : ""}`}
        >
          {t.back}
        </button>
        <button
          type="button"
          disabled={!current.valid}
          onClick={() => (last ? submit() : setStep((s) => s + 1))}
          className="bg-bone px-7 py-4 text-sm font-medium text-ink transition hover:bg-white disabled:opacity-20"
        >
          {last ? t.submit : t.next}
        </button>
      </div>
    </div>
  );
}
