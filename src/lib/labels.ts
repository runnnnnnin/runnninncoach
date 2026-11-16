import type { Locale } from "@/i18n/config";
import type { Day, Equipment, Goal, Injury, Level, SportKey } from "./types";

type Labels = {
  days: Record<Day, string>;
  daysShort: Record<Day, string>;
  goals: Record<Goal, string>;
  levels: Record<Level, string>;
  equipment: Record<Equipment, string>;
  injuries: Record<Injury, string>;
  sports: Record<SportKey, string>;
  intensity: Record<"leger" | "modere" | "intense", string>;
  ages: Record<"-25" | "25-34" | "35-44" | "45-54" | "55+", string>;
};

export const LABELS: Record<Locale, Labels> = {
  en: {
    days: { lun: "Monday", mar: "Tuesday", mer: "Wednesday", jeu: "Thursday", ven: "Friday", sam: "Saturday", dim: "Sunday" },
    daysShort: { lun: "Mon", mar: "Tue", mer: "Wed", jeu: "Thu", ven: "Fri", sam: "Sat", dim: "Sun" },
    goals: {
      "5k": "Run 5 km without stopping",
      "10k": "Run a 10K",
      semi: "Train for a half marathon",
      marathon: "Train for a marathon",
      trail: "Get into trail running",
      forme: "Get fit / lose weight",
      chrono: "Beat my personal best",
    },
    levels: {
      debutant: "I don't run (or barely)",
      occasionnel: "I run now and then",
      regulier: "I run once or twice a week",
      confirme: "I run 3+ times a week",
    },
    equipment: {
      aucun: "Nothing, bodyweight only",
      elastiques: "Resistance bands",
      halteres: "Dumbbells / kettlebell",
      salle: "A gym",
    },
    injuries: { genou: "Knee", cheville: "Ankle", achille: "Achilles / calf", dos: "Back", hanche: "Hip / glutes" },
    sports: {
      football: "Football (soccer)",
      padel: "Padel",
      tennis: "Tennis",
      basket: "Basketball",
      velo: "Cycling",
      natation: "Swimming",
      muscu: "Weight training",
      crossfit: "CrossFit",
      yoga: "Yoga / Pilates",
      rugby: "Rugby",
      handball: "Handball",
      combat: "Combat sports",
      autre: "Other",
    },
    intensity: { leger: "Light", modere: "Moderate", intense: "Intense" },
    ages: { "-25": "Under 25", "25-34": "25-34", "35-44": "35-44", "45-54": "45-54", "55+": "55+" },
  },
  fr: {
    days: { lun: "Lundi", mar: "Mardi", mer: "Mercredi", jeu: "Jeudi", ven: "Vendredi", sam: "Samedi", dim: "Dimanche" },
    daysShort: { lun: "Lun", mar: "Mar", mer: "Mer", jeu: "Jeu", ven: "Ven", sam: "Sam", dim: "Dim" },
    goals: {
      "5k": "Courir 5 km sans m'arrêter",
      "10k": "Courir un 10 km",
      semi: "Préparer un semi-marathon",
      marathon: "Préparer un marathon",
      trail: "Me mettre au trail",
      forme: "Retrouver la forme / perdre du poids",
      chrono: "Battre mon record",
    },
    levels: {
      debutant: "Je ne cours pas (ou presque)",
      occasionnel: "Je cours de temps en temps",
      regulier: "Je cours 1 à 2 fois par semaine",
      confirme: "Je cours 3 fois ou plus par semaine",
    },
    equipment: {
      aucun: "Rien, au poids du corps",
      elastiques: "Des élastiques",
      halteres: "Des haltères / kettlebell",
      salle: "Une salle de sport",
    },
    injuries: { genou: "Genou", cheville: "Cheville", achille: "Tendon d'Achille / mollet", dos: "Dos", hanche: "Hanche / fessiers" },
    sports: {
      football: "Football",
      padel: "Padel",
      tennis: "Tennis",
      basket: "Basket",
      velo: "Vélo",
      natation: "Natation",
      muscu: "Musculation",
      crossfit: "CrossFit",
      yoga: "Yoga / Pilates",
      rugby: "Rugby",
      handball: "Handball",
      combat: "Sport de combat",
      autre: "Autre",
    },
    intensity: { leger: "Léger", modere: "Modéré", intense: "Intense" },
    ages: { "-25": "Moins de 25 ans", "25-34": "25-34 ans", "35-44": "35-44 ans", "45-54": "45-54 ans", "55+": "55 ans et +" },
  },
};

/** Nom d'un sport : clé connue → libellé traduit ; sinon le texte tel quel (anciens plans). */
export const sportLabel = (lang: Locale, sport: string) => LABELS[lang].sports[sport as SportKey] ?? sport;
