/**
 * Transforme un plan en fichier calendrier (.ics), compatible Google Agenda, Apple Calendrier et Outlook.
 * Utilisable côté serveur et côté navigateur (aucune dépendance).
 */
import type { Plan, Session } from "./types";

export type CalendarOptions = {
  /** Lundi de la semaine 1, au format AAAA-MM-JJ. */
  start: string;
  /** Heure des séances "HH:MM", ou null pour des événements « toute la journée ». */
  time: string | null;
  lang: "en" | "fr";
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
const escapeText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Coupe les lignes à 74 octets environ, comme le demande la norme iCalendar. */
function fold(line: string) {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 74) {
      out.push(cur);
      cur = " " + ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}

/** Lundis à venir (semaine 1 du plan), pour proposer une date de départ. */
export function upcomingMondays(count = 6, from = new Date()) {
  const d = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  const offset = (8 - d.getUTCDay()) % 7 || 7; // lundi prochain (jamais aujourd'hui)
  d.setUTCDate(d.getUTCDate() + offset);
  return Array.from({ length: count }, (_, i) => {
    const x = new Date(d);
    x.setUTCDate(d.getUTCDate() + i * 7);
    return x.toISOString().slice(0, 10);
  });
}

function describe(s: Session, lang: "en" | "fr") {
  const lines = [s.description];
  if (s.steps?.length) lines.push("", ...s.steps.map((x, i) => `${i + 1}. ${x}`));
  if (s.exercises?.length) lines.push("", ...s.exercises.map((e) => `• ${e.name}: ${e.dose}`));
  lines.push("", `${lang === "fr" ? "Effort" : "Effort"} : ${s.effort}`);
  if (s.coachNote) lines.push("", `Coach : ${s.coachNote}`);
  lines.push("", "runflowcoach.com");
  return lines.join("\n");
}

export function planToIcs(plan: Plan, opts: CalendarOptions) {
  const [y, m, d] = opts.start.split("-").map(Number);
  const monday = Date.UTC(y, m - 1, d);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RunFlow//Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:RunFlow · ${plan.firstName}`,
  ];

  plan.weeks.forEach((week, w) => {
    week.days.forEach((day, di) => {
      const date = new Date(monday + (w * 7 + di) * 86_400_000);
      day.sessions.forEach((s, si) => {
        const uid = `${s.id}-${opts.start}@runflowcoach.com`;
        lines.push("BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${stamp}`);
        if (opts.time) {
          const [hh, mm] = opts.time.split(":").map(Number);
          // Deux séances le même jour : la seconde commence après la première.
          const startMin = hh * 60 + mm + day.sessions.slice(0, si).reduce((a, x) => a + x.minutes + 15, 0);
          const endMin = startMin + s.minutes;
          const t = (min: number) => `${pad(Math.floor(min / 60) % 24)}${pad(min % 60)}00`;
          lines.push(`DTSTART:${ymd(date)}T${t(startMin)}`, `DTEND:${ymd(date)}T${t(endMin)}`);
        } else {
          const next = new Date(date.getTime() + 86_400_000);
          lines.push(`DTSTART;VALUE=DATE:${ymd(date)}`, `DTEND;VALUE=DATE:${ymd(next)}`, "TRANSP:TRANSPARENT");
        }
        lines.push(`SUMMARY:${escapeText(`RunFlow · ${s.title} (${s.minutes} min)`)}`);
        lines.push(`DESCRIPTION:${escapeText(describe(s, opts.lang))}`);
        // Rappel 1 h avant (séances à heure fixe seulement), placé après les propriétés de l'événement.
        if (opts.time) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(s.title)}`, "TRIGGER:-PT60M", "END:VALARM");
        lines.push("END:VEVENT");
      });
    });
  });

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
