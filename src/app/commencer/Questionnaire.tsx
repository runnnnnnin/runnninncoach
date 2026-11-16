"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { savePlan } from "@/lib/storage";
import {
  DAYS,
  DAY_LABELS,
  EQUIPMENT,
  GOALS,
  INJURIES,
  LEVELS,
  SPORTS,
  type Day,
  type Equipment,
  type Goal,
  type Injury,
  type Level,
  type OtherSport,
  type Plan,
  type Profile,
} from "@/lib/types";

type Draft = Omit<Profile, "goal" | "level" | "age"> & {
  goal?: Goal;
  level?: Level;
  age?: Profile["age"];
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
};

const INTENSITY = { leger: "Léger", modere: "Modéré", intense: "Intense" } as const;

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

function Stepper({ value, min, max, onChange, unit }: { value: number; min: number; max: number; onChange: (n: number) => void; unit: string }) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label="Moins"
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
        aria-label="Plus"
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

export function Questionnaire() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSport, setNewSport] = useState<OtherSport>({ sport: "Football", day: "mar", intensity: "intense", minutes: 90 });

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const toggleDay = (day: Day) =>
    set("availableDays", d.availableDays.includes(day) ? d.availableDays.filter((x) => x !== day) : [...d.availableDays, day]);
  const toggleInjury = (i: Injury) => set("injuries", d.injuries.includes(i) ? d.injuries.filter((x) => x !== i) : [...d.injuries, i]);

  const steps: { title: string; subtitle?: string; valid: boolean; body: ReactNode }[] = [
    {
      title: "Faisons connaissance",
      subtitle: "Pour que ton coach sache à qui il parle.",
      valid: d.firstName.trim().length > 0 && !!d.age,
      body: (
        <div className="space-y-8">
          <Field label="Ton prénom">
            <input
              value={d.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              maxLength={40}
              autoFocus
              placeholder="Ex. Camille"
              className="serif w-full border-b border-hairline bg-transparent py-3 text-4xl text-bone outline-none placeholder:text-fog/40 focus:border-bone"
            />
          </Field>
          <Field label="Ton âge">
            <div className="flex flex-wrap gap-2">
              {(["-25", "25-34", "35-44", "45-54", "55+"] as const).map((a) => (
                <Chip key={a} selected={d.age === a} onClick={() => set("age", a)}>
                  {a === "-25" ? "Moins de 25" : a === "55+" ? "55 et +" : a} ans
                </Chip>
              ))}
            </div>
          </Field>
        </div>
      ),
    },
    {
      title: "Ton objectif",
      subtitle: "Ce qui te ferait vraiment plaisir dans quelques mois.",
      valid: !!d.goal,
      body: (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(Object.keys(GOALS) as Goal[]).map((g) => (
            <Choice key={g} selected={d.goal === g} onClick={() => set("goal", g)}>
              {GOALS[g]}
            </Choice>
          ))}
        </div>
      ),
    },
    {
      title: "Ton niveau aujourd'hui",
      subtitle: "Sois honnête : c'est ce qui rend le plan juste.",
      valid: !!d.level,
      body: (
        <div className="grid gap-2.5">
          {(Object.keys(LEVELS) as Level[]).map((l) => (
            <Choice key={l} selected={d.level === l} onClick={() => set("level", l)}>
              {LEVELS[l]}
            </Choice>
          ))}
        </div>
      ),
    },
    {
      title: "Ta semaine type",
      subtitle: "Coche les jours où tu peux t'entraîner (course ou renfo).",
      valid: d.availableDays.length >= 2,
      body: (
        <div className="space-y-8">
          <Field label="Jours disponibles" hint="Au moins 2 jours.">
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <Chip key={day} selected={d.availableDays.includes(day)} onClick={() => toggleDay(day)}>
                  {DAY_LABELS[day]}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Sorties course par semaine">
            <Stepper value={d.runsPerWeek} min={2} max={5} onChange={(n) => set("runsPerWeek", n)} unit="sorties" />
          </Field>
          <Field label="Séances de renfo par semaine" hint="20 à 35 minutes chacune. On conseille au moins 1.">
            <Stepper value={d.strengthPerWeek} min={0} max={3} onChange={(n) => set("strengthPerWeek", n)} unit="séances" />
          </Field>
          <Field label="Temps maximum par séance">
            <div className="flex flex-wrap gap-2">
              {[30, 45, 60, 75, 90, 120].map((m) => (
                <Chip key={m} selected={d.maxMinutes === m} onClick={() => set("maxMinutes", m)}>
                  {m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? String(m % 60) : ""}`}
                </Chip>
              ))}
            </div>
          </Field>
        </div>
      ),
    },
    {
      title: "Tes autres sports",
      subtitle: "C'est notre spécialité : ton plan s'organise autour d'eux. Ajoute tout ce que tu pratiques chaque semaine.",
      valid: true,
      body: (
        <div className="space-y-6">
          {d.otherSports.length > 0 && (
            <ul className="space-y-2">
              {d.otherSports.map((s, i) => (
                <li key={i} className="flex items-center justify-between border border-hairline bg-asphalt/60 px-4 py-3 text-sm">
                  <span>
                    <span className="serif text-lg">{s.sport}</span> · {DAY_LABELS[s.day]} · {INTENSITY[s.intensity].toLowerCase()} · {s.minutes} min
                  </span>
                  <button
                    type="button"
                    onClick={() => set("otherSports", d.otherSports.filter((_, j) => j !== i))}
                    className="label text-fog hover:text-signal"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-4 border border-dashed border-bone/20 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="label text-fog">Sport</span>
                <select
                  value={newSport.sport}
                  onChange={(e) => setNewSport({ ...newSport, sport: e.target.value })}
                  className="w-full border border-hairline bg-asphalt px-3 py-2.5 text-bone"
                >
                  {SPORTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="label text-fog">Jour</span>
                <select
                  value={newSport.day}
                  onChange={(e) => setNewSport({ ...newSport, day: e.target.value as Day })}
                  className="w-full border border-hairline bg-asphalt px-3 py-2.5 text-bone"
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {DAY_LABELS[day]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="label text-fog">Intensité</span>
                <select
                  value={newSport.intensity}
                  onChange={(e) => setNewSport({ ...newSport, intensity: e.target.value as OtherSport["intensity"] })}
                  className="w-full border border-hairline bg-asphalt px-3 py-2.5 text-bone"
                >
                  {Object.entries(INTENSITY).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="label text-fog">Durée</span>
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
              + Ajouter ce sport
            </button>
          </div>
          {d.otherSports.length === 0 && <p className="text-sm text-fog">Aucun autre sport ? Pas de souci, passe à la suite.</p>}
        </div>
      ),
    },
    {
      title: "Ton corps et ton matériel",
      subtitle: "Pour un renfo qui te protège vraiment.",
      valid: true,
      body: (
        <div className="space-y-8">
          <Field label="Pour le renfo, tu as…">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {(Object.keys(EQUIPMENT) as Equipment[]).map((e) => (
                <Choice key={e} selected={d.equipment === e} onClick={() => set("equipment", e)}>
                  {EQUIPMENT[e]}
                </Choice>
              ))}
            </div>
          </Field>
          <Field label="Des zones fragiles ou des blessures passées ?" hint="Optionnel. Plusieurs choix possibles.">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(INJURIES) as Injury[]).map((i) => (
                <Chip key={i} selected={d.injuries.includes(i)} onClick={() => toggleInjury(i)}>
                  {INJURIES[i]}
                </Chip>
              ))}
            </div>
          </Field>
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
        body: JSON.stringify(d),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      savePlan(data as Plan);
      router.push("/plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue, réessaie.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <div className="h-px w-40 overflow-hidden bg-hairline"><div className="h-px w-1/3 animate-[streak_1.2s_ease-in-out_infinite_alternate] bg-bone" /></div>
        <p className="serif mt-10 text-4xl">{d.firstName}, ton coach prépare ton plan…</p>
        <p className="mt-3 text-fog">On place chaque séance autour de ta semaine et ton coach t'écrit ses conseils. Compte une quinzaine de secondes.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="label mb-3 flex justify-between text-fog">
          <span>
            Étape {step + 1} sur {steps.length}
          </span>
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
          ← Retour
        </button>
        <button
          type="button"
          disabled={!current.valid}
          onClick={() => (last ? submit() : setStep((s) => s + 1))}
          className="bg-bone px-7 py-4 text-sm font-medium text-ink transition hover:bg-white disabled:opacity-20"
        >
          {last ? "Générer mon plan →" : "Continuer →"}
        </button>
      </div>
    </div>
  );
}
