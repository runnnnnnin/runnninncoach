import ExcelJS from "exceljs";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminPasswordSet, adminToken, safeEqual } from "@/lib/admin-auth";
import { dbConfigured, exportData } from "@/lib/db";
import { LABELS, sportLabel } from "@/lib/labels";

const FR = LABELS.fr;
const FEELING: Record<string, string> = { trop_dur: "Trop dur", ok: "Juste bien", trop_facile: "Trop facile" };

// Export Excel des inscrits et des retours (réservé à l'admin connecté).
export async function GET() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  if (!adminPasswordSet() || !safeEqual(token, adminToken())) return new Response("Non autorisé", { status: 401 });
  if (!dbConfigured()) return new Response("Base non branchée", { status: 503 });

  const { testers, feedback } = await exportData();
  const wb = new ExcelJS.Workbook();
  wb.creator = "RunFlow";

  const ws = wb.addWorksheet("Inscrits", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Date", key: "date", width: 18, style: { numFmt: "dd/mm/yyyy hh:mm" } },
    { header: "Prénom", key: "name", width: 14 },
    { header: "Email", key: "email", width: 30 },
    { header: "Accepte les nouvelles", key: "news", width: 12 },
    { header: "Langue", key: "lang", width: 8 },
    { header: "Objectif principal", key: "goal", width: 30 },
    { header: "Autres objectifs", key: "goals", width: 30 },
    { header: "Niveau", key: "level", width: 30 },
    { header: "Âge", key: "age", width: 12 },
    { header: "Jours dispo", key: "days", width: 22 },
    { header: "Sorties / sem.", key: "runs", width: 10 },
    { header: "Renfo / sem.", key: "strength", width: 10 },
    { header: "Durée max (min)", key: "max", width: 10 },
    { header: "Autres sports", key: "sports", width: 40 },
    { header: "Matériel", key: "equipment", width: 28 },
    { header: "Fragilités", key: "injuries", width: 22 },
    { header: "Plan écrit par l'IA", key: "ai", width: 10 },
    { header: "Nb de retours", key: "fb", width: 10 },
    { header: "Dernière semaine notée", key: "lastWeek", width: 10 },
    { header: "Séances faites (%) selon retours", key: "done", width: 10 },
    { header: "A un compte", key: "account", width: 10 },
    { header: "Séances cochées", key: "checked", width: 10 },
  ];
  for (const t of testers) {
    const p = t.profile;
    const eq = Array.isArray(p.equipment) ? p.equipment : [p.equipment as unknown as string];
    ws.addRow({
      date: new Date(t.created_at),
      name: t.first_name,
      email: t.email,
      news: t.consent_news ? "Oui" : "Non",
      lang: (p.lang ?? "fr").toUpperCase(),
      goal: FR.goals[p.goal] ?? p.goal,
      goals: (p.otherGoals ?? []).map((g) => FR.goals[g] ?? g).join(", "),
      level: FR.levels[p.level] ?? p.level,
      age: FR.ages[p.age] ?? p.age,
      days: p.availableDays.map((d) => FR.daysShort[d]).join(", "),
      runs: p.runsPerWeek,
      strength: p.strengthPerWeek,
      max: p.maxMinutes,
      sports: p.otherSports.map((o) => `${sportLabel("fr", o.sport)} (${FR.daysShort[o.day]}, ${FR.intensity[o.intensity].toLowerCase()})`).join(", "),
      equipment: eq.map((e) => FR.equipment[e as keyof typeof FR.equipment] ?? e).join(", "),
      injuries: p.injuries.map((i) => FR.injuries[i]).join(", "),
      ai: t.ai ? "Oui" : "Non",
      fb: t.feedback_count,
      lastWeek: t.last_week ?? "",
      done: t.done_pct ?? "",
      account: t.has_account ? "Oui" : "Non",
      checked: t.checked,
    });
  }

  const wf = wb.addWorksheet("Retours", { views: [{ state: "frozen", ySplit: 1 }] });
  wf.columns = [
    { header: "Date", key: "date", width: 18, style: { numFmt: "dd/mm/yyyy hh:mm" } },
    { header: "Prénom", key: "name", width: 14 },
    { header: "Email", key: "email", width: 30 },
    { header: "Semaine", key: "week", width: 9 },
    { header: "Séances faites", key: "done", width: 10 },
    { header: "Séances prévues", key: "planned", width: 10 },
    { header: "Ressenti", key: "feeling", width: 14 },
    { header: "Douleur", key: "pain", width: 9 },
    { header: "Commentaire", key: "comment", width: 60 },
  ];
  for (const f of feedback)
    wf.addRow({
      date: new Date(f.created_at),
      name: f.first_name,
      email: f.email,
      week: f.week,
      done: f.sessions_done,
      planned: f.sessions_planned,
      feeling: FEELING[f.feeling] ?? f.feeling,
      pain: f.pain ? "Oui" : "Non",
      comment: f.comment ?? "",
    });

  for (const sheet of [ws, wf]) {
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0A0B" } };
    sheet.getRow(1).alignment = { vertical: "middle", wrapText: true };
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
  }

  const buf = await wb.xlsx.writeBuffer();
  const day = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="runflow-inscrits-${day}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
