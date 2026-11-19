"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import { planToIcs, upcomingMondays } from "@/lib/ics";
import type { Plan } from "@/lib/types";

const TIMES = ["06:30", "07:30", "12:15", "18:00", "18:30", "19:30"];

/** « Ajouter à mon calendrier » : choix du lundi de départ et de l'heure, puis fichier .ics. */
export function CalendarExport({ plan, lang }: { plan: Plan; lang: Locale }) {
  const t = UI_TEXT[lang].cal;
  const [mondays] = useState(() => upcomingMondays(6));
  const [start, setStart] = useState(mondays[0]);
  const [time, setTime] = useState<string>("");

  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { weekday: "long", day: "numeric", month: "long" });

  const params = new URLSearchParams({ start, lang, ...(time ? { time } : {}) });
  const serverUrl = plan.testerId ? `/api/calendar/${plan.testerId}?${params}` : null;

  function downloadLocally() {
    const ics = planToIcs(plan, { start, time: time || null, lang });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "runflow-plan.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  return (
    <section className="no-print mt-10 border border-hairline bg-asphalt/60 p-5 sm:p-6">
      <p className="label text-signal">{t.kicker}</p>
      <h3 className="serif mt-2 text-3xl leading-tight">{t.title}</h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="label text-mist">{t.start}</span>
          <select value={start} onChange={(e) => setStart(e.target.value)} className="w-full border border-hairline bg-night px-3 py-2.5 text-bone">
            {mondays.map((m) => (
              <option key={m} value={m}>
                {fmt(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="label text-mist">{t.time}</span>
          <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full border border-hairline bg-night px-3 py-2.5 text-bone">
            <option value="">{t.allDay}</option>
            {TIMES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
      </div>
      {serverUrl ? (
        <a href={serverUrl} className="mt-5 inline-flex w-full items-center justify-center gap-3 bg-bone px-5 py-3.5 text-sm font-medium text-ink hover:bg-mist sm:w-auto">
          {t.button} <span>↓</span>
        </a>
      ) : (
        <button onClick={downloadLocally} className="mt-5 w-full bg-bone px-5 py-3.5 text-sm font-medium text-ink hover:bg-mist sm:w-auto">
          {t.button} ↓
        </button>
      )}
      <p className="mt-3 text-xs leading-relaxed text-fog">{time ? t.helpTimed : t.helpAllDay}</p>
    </section>
  );
}
