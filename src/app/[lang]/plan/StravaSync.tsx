"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import { upcomingMondays } from "@/lib/ics";
import type { Done } from "@/lib/progress";

export type Details = Record<string, { km: number; sec: number }>;
type SyncResult = { matched: number; done: Done; details: Details; start: string | null };

/** Bandeau Strava du plan : lundi de départ + synchronisation (automatique à l'ouverture, ou au clic). */
export function StravaSync({
  planId,
  lang,
  start,
  onSynced,
}: {
  planId: string;
  lang: Locale;
  start: string | null;
  onSynced: (r: SyncResult) => void;
}) {
  const t = UI_TEXT[lang].strava;
  // Les 8 derniers lundis et les 4 prochains : le plan a pu commencer avant la liaison.
  const [mondays] = useState(() => upcomingMondays(12, new Date(Date.now() - 57 * 86_400_000)));
  const [chosen, setChosen] = useState(start ?? "");
  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");
  const [matched, setMatched] = useState<number | null>(null);
  const autoDone = useRef(false);

  async function sync(startDate: string, auto: boolean) {
    setStatus("busy");
    try {
      const res = await fetch("/api/strava/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, start: startDate, auto }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as SyncResult;
      if (!auto || data.matched > 0) setMatched(data.matched);
      onSynced(data);
      setStatus("idle");
    } catch {
      setStatus(auto ? "idle" : "error");
    }
  }

  // À l'ouverture du plan : on récupère les nouvelles activités sans rien demander.
  useEffect(() => {
    if (!start || autoDone.current) return;
    autoDone.current = true;
    void sync(start, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { weekday: "short", day: "numeric", month: "short" });
  const value = chosen || start || "";

  return (
    <section className="no-print mt-6 border border-hairline bg-asphalt/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label" style={{ color: "#fc4c02" }}>
            Strava
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-mist/80">{value ? t.barOn : t.barChoose}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="label block text-fog">{t.startLabel}</span>
            <select
              value={value}
              onChange={(e) => setChosen(e.target.value)}
              className="mt-2 border border-hairline bg-night px-3 py-2.5 text-bone"
            >
              <option value="" disabled>
                {t.startPick}
              </option>
              {mondays.map((m) => (
                <option key={m} value={m}>
                  {fmt(m)}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => value && sync(value, false)}
            disabled={!value || status === "busy"}
            className="border border-bone/50 px-4 py-2.5 text-sm text-bone hover:border-bone disabled:opacity-40"
          >
            {status === "busy" ? t.syncing : t.sync}
          </button>
        </div>
      </div>
      {status === "error" && <p className="mt-3 text-sm text-signal">{t.syncError}</p>}
      {status !== "error" && matched !== null && <p className="mt-3 text-sm text-mist">{t.synced(matched)}</p>}
      <p className="label mt-4 text-fog/70">Powered by Strava</p>
    </section>
  );
}
