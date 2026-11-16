/**
 * Couche IA : Claude réécrit les textes du plan pour qu'ils parlent vraiment à la personne.
 * Il ne touche JAMAIS aux jours, durées ni intensités : ça reste au moteur (engine.ts).
 * Sans clé d'IA configurée, le plan du moteur est renvoyé tel quel.
 */
import { generateText, Output } from "ai";
import { z } from "zod";
import { LABELS, sportLabel } from "./labels";
import type { Plan, Profile } from "./types";

// Le contexte envoyé à l'IA est en français ; la langue de SA réponse suit celle choisie par l'utilisateur.
const FR = LABELS.fr;
const DAY_LABELS = FR.days;

// Haiku : inclus dans les crédits gratuits de l'AI Gateway. Pour un modèle plus puissant, définir RUNFLOW_MODEL sur Vercel.
const MODEL = process.env.RUNFLOW_MODEL ?? "anthropic/claude-haiku-5.5";

// Sur Vercel, l'accès à l'AI Gateway se fait sans clé (jeton OIDC ajouté à chaque requête).
// En local, il faut AI_GATEWAY_API_KEY (ou `vercel env pull`).
export const aiConfigured = () =>
  Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL);

const outputSchema = z.object({
  intro: z.string().describe("Message d'accueil du coach, 2 à 4 phrases, tutoiement, motivant et concret"),
  weekFocus: z.array(z.string()).length(4).describe("Une phrase d'objectif par semaine, dans l'ordre"),
  tips: z.array(z.string()).min(3).max(4).describe("Conseils personnalisés courts"),
  sessionNotes: z
    .array(z.object({ id: z.string(), note: z.string().describe("1 à 2 phrases personnalisées") }))
    .describe("Une note par séance, en reprenant exactement l'id fourni"),
});

function describeProfile(p: Profile) {
  const sports = p.otherSports.length
    ? p.otherSports.map((s) => `${sportLabel("fr", s.sport)} le ${DAY_LABELS[s.day].toLowerCase()} (${s.intensity}, ${s.minutes} min)`).join(" ; ")
    : "aucun";
  return [
    `Prénom : ${p.firstName}, tranche d'âge : ${p.age}`,
    `Objectif : ${FR.goals[p.goal]}`,
    `Niveau : ${FR.levels[p.level]}`,
    `Autres sports : ${sports}`,
    `Matériel renfo : ${FR.equipment[p.equipment]}`,
    `Fragilités : ${p.injuries.length ? p.injuries.map((i) => FR.injuries[i]).join(", ") : "aucune"}`,
  ].join("\n");
}

function describePlan(plan: Plan) {
  return plan.weeks
    .map(
      (w) =>
        `${w.label} (${w.runMinutes} min de course)\n` +
        w.days
          .flatMap((d) => [
            ...d.sessions.map((s) => `- id=${s.id} | ${DAY_LABELS[d.day]} | ${s.title} | ${s.minutes} min${s.coachNote ? ` | note moteur : ${s.coachNote}` : ""}`),
            ...d.otherSports.map((o) => `- ${DAY_LABELS[d.day]} | (autre sport) ${sportLabel("fr", o.sport)}, ${o.intensity}`),
          ])
          .join("\n"),
    )
    .join("\n\n");
}

export async function personalize(profile: Profile, plan: Plan): Promise<Plan> {
  if (!aiConfigured()) return plan;
  try {
    const { output } = await generateText({
      model: MODEL,
      timeout: 45_000,
      output: Output.object({ schema: outputSchema }),
      system:
        "Tu es le coach de RunFlow, une app de course à pied + renforcement qui tient compte des autres sports pratiqués. " +
        (profile.lang === "en"
          ? "Tu écris TOUTE ta réponse en anglais (friendly, second person, casual 'you'), même si le contexte est en français. "
          : "Tu écris en français, tu tutoies. ") +
        "Ton ton est chaleureux, positif et concret, sans jargon inutile. " +
        "Le plan t'est fourni déjà construit : tu ne modifies JAMAIS les jours, durées, intensités ni le nombre de séances, " +
        "et tu ne proposes jamais d'en faire plus. Tu expliques le pourquoi des choix (notamment le lien avec les autres sports) " +
        "et tu donnes envie de s'y tenir. Pas de conseil médical : en cas de douleur, on recommande de consulter.",
      prompt: `Profil :\n${describeProfile(profile)}\n\nPlan construit :\n${describePlan(plan)}`,
    });

    const notes = new Map(output.sessionNotes.map((n) => [n.id, n.note]));
    return {
      ...plan,
      intro: output.intro,
      tips: output.tips,
      personalizedByAI: true,
      weeks: plan.weeks.map((w, i) => ({
        ...w,
        focus: output.weekFocus[i] ?? w.focus,
        days: w.days.map((d) => ({
          ...d,
          sessions: d.sessions.map((s) => ({ ...s, coachNote: notes.get(s.id) ?? s.coachNote })),
        })),
      })),
    };
  } catch (err) {
    console.error("[RunFlow] Personnalisation IA impossible, plan du moteur utilisé :", err);
    return plan;
  }
}
