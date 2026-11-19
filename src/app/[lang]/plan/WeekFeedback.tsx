"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import type { Week } from "@/lib/types";

const FEELINGS = ["trop_dur", "ok", "trop_facile"] as const;

const key = (testerId: string, week: number) => `runflow.fb.${testerId}.${week}`;

function alreadySent(testerId: string, week: number) {
  try {
    return localStorage.getItem(key(testerId, week)) === "1";
  } catch {
    return false;
  }
}

/** Le retour de fin de semaine : ce qui permet de savoir si les testeurs suivent vraiment leur plan. */
export function WeekFeedback({ testerId, week, lang }: { testerId: string; week: Week; lang: Locale }) {
  const t = UI_TEXT[lang].fb;
  const planned = week.days.reduce((n, d) => n + d.sessions.length, 0);
  const [sent, setSent] = useState(() => alreadySent(testerId, week.index));
  const [done, setDone] = useState(planned);
  const [feeling, setFeeling] = useState<(typeof FEELINGS)[number] | null>(null);
  const [pain, setPain] = useState(false);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function send() {
    if (!feeling) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testerId, week: week.index, sessionsDone: done, sessionsPlanned: planned, feeling, pain, comment }),
      });
      if (!res.ok) throw new Error();
      try {
        localStorage.setItem(key(testerId, week.index), "1");
      } catch {}
      setSent(true);
    } catch {
      setStatus("error");
    }
  }

  if (sent)
    return (
      <div className="no-print mt-8 border border-hairline px-5 py-6 text-center">
        <p className="serif text-2xl">{t.thanks}</p>
        <p className="mt-2 text-sm text-fog">{t.thanksSub}</p>
        <button onClick={() => setSent(false)} className="label mt-4 text-fog hover:text-bone">
          {t.edit}
        </button>
      </div>
    );

  return (
    <div className="no-print mt-8 border border-hairline bg-asphalt/60 p-5 sm:p-6">
      <p className="label text-signal">{t.kicker(week.label)}</p>
      <h3 className="serif mt-2 text-3xl leading-tight">{t.title}</h3>

      <div className="mt-6">
        <p className="label text-mist">{t.done}</p>
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            aria-label="−"
            disabled={done <= 0}
            onClick={() => setDone(done - 1)}
            className="h-10 w-10 border border-hairline text-lg disabled:opacity-25"
          >
            −
          </button>
          <span className="serif min-w-24 text-center text-3xl">
            {done} <span className="text-lg text-fog">/ {planned}</span>
          </span>
          <button
            type="button"
            aria-label="+"
            disabled={done >= planned}
            onClick={() => setDone(done + 1)}
            className="h-10 w-10 border border-hairline text-lg disabled:opacity-25"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6">
        <p className="label text-mist">{t.feeling}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {FEELINGS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={feeling === f}
              onClick={() => setFeeling(f)}
              className={`border px-2 py-3 text-sm transition ${
                feeling === f ? "border-bone bg-bone text-ink" : "border-hairline text-bone hover:border-bone/50"
              }`}
            >
              {t.feelings[f]}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm text-mist/85">
        <input type="checkbox" checked={pain} onChange={(e) => setPain(e.target.checked)} className="h-4 w-4 accent-[var(--signal)]" />
        {t.pain}
      </label>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder={t.commentPh}
        className="mt-5 w-full border border-hairline bg-night/60 px-3 py-2.5 text-sm text-bone outline-none placeholder:text-fog/60 focus:border-bone/50"
      />

      {pain && (
        <p className="mt-3 text-sm text-signal">
          {t.painNote}
        </p>
      )}
      {status === "error" && <p className="mt-3 text-sm text-signal">{t.error}</p>}

      <button
        type="button"
        disabled={!feeling || status === "sending"}
        onClick={send}
        className="mt-5 w-full bg-bone px-5 py-3.5 text-sm font-medium text-ink transition hover:bg-mist disabled:opacity-25 sm:w-auto"
      >
        {status === "sending" ? t.sending : t.send}
      </button>
    </div>
  );
}
