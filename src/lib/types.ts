import { z } from "zod";

export const DAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"] as const;
export type Day = (typeof DAYS)[number];
export const DAY_LABELS: Record<Day, string> = {
  lun: "Lundi",
  mar: "Mardi",
  mer: "Mercredi",
  jeu: "Jeudi",
  ven: "Vendredi",
  sam: "Samedi",
  dim: "Dimanche",
};

export const GOALS = {
  "5k": "Courir 5 km sans m'arrêter",
  "10k": "Courir un 10 km",
  semi: "Préparer un semi-marathon",
  marathon: "Préparer un marathon",
  trail: "Me mettre au trail",
  forme: "Retrouver la forme / perdre du poids",
  chrono: "Battre mon record",
} as const;
export type Goal = keyof typeof GOALS;

export const LEVELS = {
  debutant: "Je ne cours pas (ou presque)",
  occasionnel: "Je cours de temps en temps",
  regulier: "Je cours 1 à 2 fois par semaine",
  confirme: "Je cours 3 fois ou plus par semaine",
} as const;
export type Level = keyof typeof LEVELS;

export const EQUIPMENT = {
  aucun: "Rien, au poids du corps",
  elastiques: "Des élastiques",
  halteres: "Des haltères / kettlebell",
  salle: "Une salle de sport",
} as const;
export type Equipment = keyof typeof EQUIPMENT;

export const INJURIES = {
  genou: "Genou",
  cheville: "Cheville",
  achille: "Tendon d'Achille / mollet",
  dos: "Dos",
  hanche: "Hanche / fessiers",
} as const;
export type Injury = keyof typeof INJURIES;

export const SPORTS = [
  "Football",
  "Padel",
  "Tennis",
  "Basket",
  "Vélo",
  "Natation",
  "Musculation",
  "CrossFit",
  "Yoga / Pilates",
  "Rugby",
  "Handball",
  "Sport de combat",
  "Autre",
] as const;

export const otherSportSchema = z.object({
  sport: z.string().min(1).max(40),
  day: z.enum(DAYS),
  intensity: z.enum(["leger", "modere", "intense"]),
  minutes: z.number().int().min(15).max(240),
});
export type OtherSport = z.infer<typeof otherSportSchema>;

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(40),
  age: z.enum(["-25", "25-34", "35-44", "45-54", "55+"]),
  goal: z.enum(Object.keys(GOALS) as [Goal, ...Goal[]]),
  level: z.enum(Object.keys(LEVELS) as [Level, ...Level[]]),
  availableDays: z.array(z.enum(DAYS)).min(2).max(7),
  runsPerWeek: z.number().int().min(2).max(5),
  strengthPerWeek: z.number().int().min(0).max(3),
  maxMinutes: z.number().int().min(30).max(150),
  otherSports: z.array(otherSportSchema).max(6),
  equipment: z.enum(Object.keys(EQUIPMENT) as [Equipment, ...Equipment[]]),
  injuries: z.array(z.enum(Object.keys(INJURIES) as [Injury, ...Injury[]])),
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
  firstName: string;
  goalLabel: string;
  intro: string;
  tips: string[];
  warnings: string[];
  weeks: Week[];
  personalizedByAI: boolean;
  createdAt: string;
};
