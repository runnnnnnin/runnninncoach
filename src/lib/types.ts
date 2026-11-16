import { z } from "zod";
import { LOCALES, type Locale } from "@/i18n/config";

// Les libellés affichés (dans chaque langue) sont dans labels.ts. Ici : seulement les clés.
export const DAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"] as const;
export type Day = (typeof DAYS)[number];

export const GOAL_KEYS = ["5k", "10k", "semi", "marathon", "trail", "forme", "chrono"] as const;
export type Goal = (typeof GOAL_KEYS)[number];

export const LEVEL_KEYS = ["debutant", "occasionnel", "regulier", "confirme"] as const;
export type Level = (typeof LEVEL_KEYS)[number];

export const EQUIPMENT_KEYS = ["aucun", "elastiques", "halteres", "salle"] as const;
export type Equipment = (typeof EQUIPMENT_KEYS)[number];

export const INJURY_KEYS = ["genou", "cheville", "achille", "dos", "hanche"] as const;
export type Injury = (typeof INJURY_KEYS)[number];

export const SPORT_KEYS = [
  "football",
  "padel",
  "tennis",
  "basket",
  "velo",
  "natation",
  "muscu",
  "crossfit",
  "yoga",
  "rugby",
  "handball",
  "combat",
  "autre",
] as const;
export type SportKey = (typeof SPORT_KEYS)[number];

export const AGE_KEYS = ["-25", "25-34", "35-44", "45-54", "55+"] as const;

export const otherSportSchema = z.object({
  sport: z.string().min(1).max(40),
  day: z.enum(DAYS),
  intensity: z.enum(["leger", "modere", "intense"]),
  minutes: z.number().int().min(15).max(240),
});
export type OtherSport = z.infer<typeof otherSportSchema>;

export const profileSchema = z.object({
  lang: z.enum(LOCALES).default("en"),
  firstName: z.string().trim().min(1).max(40),
  age: z.enum(AGE_KEYS),
  goal: z.enum(GOAL_KEYS),
  /** Objectifs secondaires (le principal est `goal`). */
  otherGoals: z.array(z.enum(GOAL_KEYS)).max(2).default([]),
  level: z.enum(LEVEL_KEYS),
  availableDays: z.array(z.enum(DAYS)).min(2).max(7),
  runsPerWeek: z.number().int().min(2).max(5),
  strengthPerWeek: z.number().int().min(0).max(3),
  maxMinutes: z.number().int().min(30).max(150),
  otherSports: z.array(otherSportSchema).max(14),
  equipment: z.array(z.enum(EQUIPMENT_KEYS)).min(1),
  injuries: z.array(z.enum(INJURY_KEYS)),
});
export type Profile = z.infer<typeof profileSchema>;

export type SessionKind = "facile" | "qualite" | "longue" | "marche-course" | "renfo";

export type Exercise = { name: string; dose: string; cue?: string };

export type Session = {
  id: string;
  kind: SessionKind;
  title: string;
  minutes: number;
  effort: string;
  description: string;
  steps?: string[];
  exercises?: Exercise[];
  coachNote?: string;
};

export type DayPlan = {
  day: Day;
  sessions: Session[];
  otherSports: OtherSport[];
};

export type Week = {
  index: number;
  label: string;
  focus: string;
  runMinutes: number;
  days: DayPlan[];
};

export type Plan = {
  lang?: Locale;
  firstName: string;
  goalLabel: string;
  intro: string;
  tips: string[];
  warnings: string[];
  weeks: Week[];
  personalizedByAI: boolean;
  createdAt: string;
  /** Identifiant du testeur en base (absent si la base n'est pas branchée). */
  testerId?: string;
};
