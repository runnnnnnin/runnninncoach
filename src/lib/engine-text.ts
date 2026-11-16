/** Tous les textes produits par le moteur de plan, en anglais et en français. */
import type { Locale } from "@/i18n/config";

type QualityFamily = "fartlek" | "vma" | "seuil" | "cotes";

export type EngineText = {
  weeks: { label: string; focus: string }[];
  effort: Record<"facile" | "qualite" | "longue" | "marche-course" | "renfo", string>;
  walkRun: { description: string; warm: string; main: (reps: number, run: number, walk: number) => string; cool: string; title: string; titleLong: string };
  quality: Record<QualityFamily, { title: string; description: string; main: string[] }>;
  warmup: (min: number) => string;
  cooldown: (min: number) => string;
  long: { title: string; trailTitle: string; trail: string; marathonW3: string; default: string };
  easy: { title: string; occasional: string; default: string };
  strength: { title: string; description: string };
  ex: Record<string, string>;
  cue: Record<string, string>;
  perLeg: string;
  perSide: string;
  perFoot: string;
  noteAfter: (sport: string) => string;
  noteSameDayRun: (sport: string) => string;
  noteSameDayStrength: (sport: string) => string;
  warnFewDays: (wanted: number, runs: number) => string;
  warnInjury: (list: string) => string;
  warnCheckup: string;
  warnHardDays: (days: string) => string;
  warnMedical: string;
  intro: (name: string) => string;
  tips: string[];
};

const fmtNum = (n: number, lang: Locale) => (lang === "fr" ? String(n).replace(".", ",") : String(n));

export const ENGINE_TEXT: Record<Locale, EngineText> = {
  fr: {
    weeks: [
      { label: "Semaine 1", focus: "Prise de repères : on installe le rythme sans forcer." },
      { label: "Semaine 2", focus: "On construit : un peu plus de volume, toujours en contrôle." },
      { label: "Semaine 3", focus: "La semaine la plus chargée du bloc." },
      { label: "Semaine 4", focus: "Semaine allégée : ton corps assimile et devient plus fort." },
    ],
    effort: {
      facile: "Facile, 4/10 : tu peux parler en courant",
      qualite: "Soutenu, 7-8/10 sur les parties rapides",
      longue: "Très facile, 3-4/10 : le secret, c'est la patience",
      "marche-course": "Facile : la course doit rester confortable",
      renfo: "Contrôlé : technique avant la charge",
    },
    walkRun: {
      title: "Marche-course",
      titleLong: "Marche-course longue",
      description: "Alterner course très lente et marche : c'est la méthode la plus sûre pour construire ton endurance sans te blesser.",
      warm: "5 min de marche active pour s'échauffer",
      main: (reps, run, walk) => `${reps} × (${run} min de course lente + ${fmtNum(walk, "fr")} min de marche)`,
      cool: "5 min de marche, puis étirements doux",
    },
    quality: {
      fartlek: {
        title: "Fartlek",
        description: "Jouer avec l'allure : des passages plus rapides, sans jamais être à fond.",
        main: ["6 × (1 min dynamique + 2 min facile)", "8 × (1 min dynamique + 1 min 30 facile)", "6 × (1 min 30 dynamique + 1 min 30 facile)", "6 × 20 s d'accélération progressive, récup libre"],
      },
      vma: {
        title: "Fractionné court",
        description: "Développer ta vitesse : rapide mais régulier, la dernière répétition doit ressembler à la première.",
        main: ["8 × (30 s rapide + 30 s trot)", "10 × (30 s rapide + 30 s trot)", "6 × (1 min rapide + 1 min trot)", "6 × (30 s rapide + 30 s trot)"],
      },
      seuil: {
        title: "Allure seuil",
        description: "« Confortablement difficile » : tu peux dire quelques mots, pas une phrase entière.",
        main: ["3 × 6 min à allure soutenue, 2 min de trot entre", "3 × 8 min à allure soutenue, 2 min de trot entre", "2 × 12 min à allure soutenue, 3 min de trot entre", "4 × 3 min à allure soutenue, 1 min 30 de trot entre"],
      },
      cotes: {
        title: "Côtes",
        description: "Renforcer jambes et foulée pour le trail : pousse sur l'avant du pied, buste droit.",
        main: ["8 × 30 s en montée, retour en marchant", "10 × 30 s en montée, retour en marchant", "6 × 1 min en montée, retour en marchant", "Parcours vallonné libre, marche dans les pentes raides"],
      },
    },
    warmup: (m) => `${m} min de footing facile + 3 accélérations progressives`,
    cooldown: (m) => `${m} min de retour au calme en trottinant`,
    long: {
      title: "Sortie longue",
      trailTitle: "Sortie longue nature",
      trail: "Sur chemins si possible. Marcher dans les montées raides fait partie du trail : ce n'est pas tricher.",
      marathonW3: "Tout en aisance, avec les 15 dernières minutes à ton allure marathon visée.",
      default: "Allure très lente : si tu es essoufflé, ralentis. C'est elle qui construit ton endurance.",
    },
    easy: {
      title: "Footing facile",
      occasional: "En aisance totale. Une pause marche de 1 min si besoin, aucun souci.",
      default: "En endurance fondamentale : allure de conversation, on finit frais.",
    },
    strength: {
      title: "Renfo du coureur",
      description: "Muscler ce qui protège tes articulations et rend ta foulée plus efficace. 1 min de récup entre les séries.",
    },
    ex: {
      legPress: "Presse à cuisses",
      goblet: "Goblet squat (haltère contre la poitrine)",
      squat: "Squat au poids du corps",
      stepDown: "Step-down lent sur une marche",
      wallSit: "Chaise contre le mur",
      lungeDb: "Fente arrière avec haltères",
      lunge: "Fente arrière alternée",
      rdl: "Soulevé de terre jambes tendues",
      bridge: "Pont fessier sur une jambe",
      eccentricCalf: "Mollets excentriques sur une marche",
      calf: "Montées sur pointes de pieds",
      balance: "Équilibre sur un pied (yeux fermés si trop facile)",
      bandWalk: "Marche latérale avec élastique",
      abduction: "Abduction de hanche couché sur le côté",
      plank: "Gainage planche",
      deadBug: "Dead bug",
      sidePlank: "Gainage latéral",
      row: "Tirage horizontal",
      bandRow: "Tirage élastique (dos)",
      birdDog: "Bird-dog",
    },
    cue: {
      squat: "Genoux dans l'axe des pieds",
      stepDown: "Descends en 3 secondes, genou au-dessus du pied",
      rdl: "Dos plat, hanches vers l'arrière",
      eccentricCalf: "Monte sur deux pieds, redescends sur un seul en 3 s",
      deadBug: "Bas du dos collé au sol",
    },
    perLeg: "/ jambe",
    perSide: "/ côté",
    perFoot: "/ pied",
    noteAfter: (s) => `Lendemain de ${s.toLowerCase()} : garde cette séance très tranquille, c'est aussi de la récupération.`,
    noteSameDayRun: (s) => `Tu as aussi ${s.toLowerCase()} ce jour-là : fais la course à une autre heure et reste vraiment facile.`,
    noteSameDayStrength: (s) => `Tu as aussi ${s.toLowerCase()} ce jour-là : fais le renfo à un autre moment de la journée, ou seulement la moitié des séries.`,
    warnFewDays: (w, r) => `Tu voulais ${w} sorties mais tu n'as que ${r} jours disponibles : le plan en prévoit ${r}.`,
    warnInjury: (l) => `Tu as signalé une fragilité (${l}) : la progression est plus douce et le renfo est adapté. Une douleur qui revient = on arrête et on consulte.`,
    warnCheckup: "Si tu reprends le sport après une longue pause, un rapide check-up chez ton médecin est une bonne idée.",
    warnHardDays: (d) => `Tes jours de sport intense (${d}) sont pris en compte : pas de séance dure ces jours-là ni le lendemain quand c'est possible.`,
    warnMedical: "Ce plan ne remplace pas un avis médical. Écoute ton corps.",
    intro: (n) => `${n}, voici ton premier bloc de 4 semaines. Il est construit autour de ta vraie semaine, tes autres sports compris : la régularité compte plus que l'intensité.`,
    tips: [
      "La plupart de tes sorties doivent être faciles : c'est ce qui fait progresser sans se blesser.",
      "Une séance ratée ? Ne la rattrape pas, reprends simplement le plan le lendemain.",
      "Dors, hydrate-toi et mange assez : c'est pendant la récupération que tu deviens plus fort.",
    ],
  },
  en: {
    weeks: [
      { label: "Week 1", focus: "Finding your bearings: we set the rhythm without forcing it." },
      { label: "Week 2", focus: "Building up: a little more volume, always in control." },
      { label: "Week 3", focus: "The biggest week of the block." },
      { label: "Week 4", focus: "Lighter week: your body absorbs the work and gets stronger." },
    ],
    effort: {
      facile: "Easy, 4/10: you can talk while running",
      qualite: "Hard, 7-8/10 on the fast parts",
      longue: "Very easy, 3-4/10: patience is the secret",
      "marche-course": "Easy: running should stay comfortable",
      renfo: "Controlled: form before load",
    },
    walkRun: {
      title: "Run-walk",
      titleLong: "Long run-walk",
      description: "Alternate very slow running and walking: the safest way to build endurance without getting hurt.",
      warm: "5 min brisk walk to warm up",
      main: (reps, run, walk) => `${reps} × (${run} min slow running + ${fmtNum(walk, "en")} min walking)`,
      cool: "5 min walk, then gentle stretching",
    },
    quality: {
      fartlek: {
        title: "Fartlek",
        description: "Play with pace: faster bursts, never all-out.",
        main: ["6 × (1 min brisk + 2 min easy)", "8 × (1 min brisk + 1:30 easy)", "6 × (1:30 brisk + 1:30 easy)", "6 × 20 s progressive strides, free recovery"],
      },
      vma: {
        title: "Short intervals",
        description: "Build your speed: fast but even, your last rep should feel like your first.",
        main: ["8 × (30 s fast + 30 s jog)", "10 × (30 s fast + 30 s jog)", "6 × (1 min fast + 1 min jog)", "6 × (30 s fast + 30 s jog)"],
      },
      seuil: {
        title: "Tempo",
        description: "\"Comfortably hard\": you can say a few words, not a full sentence.",
        main: ["3 × 6 min at tempo pace, 2 min jog between", "3 × 8 min at tempo pace, 2 min jog between", "2 × 12 min at tempo pace, 3 min jog between", "4 × 3 min at tempo pace, 1:30 jog between"],
      },
      cotes: {
        title: "Hills",
        description: "Strengthen legs and stride for trail: drive from the forefoot, chest tall.",
        main: ["8 × 30 s uphill, walk back down", "10 × 30 s uphill, walk back down", "6 × 1 min uphill, walk back down", "Free rolling route, hike the steep bits"],
      },
    },
    warmup: (m) => `${m} min easy jog + 3 progressive strides`,
    cooldown: (m) => `${m} min easy jog to cool down`,
    long: {
      title: "Long run",
      trailTitle: "Long trail run",
      trail: "On trails if you can. Hiking the steep climbs is part of trail running: it's not cheating.",
      marathonW3: "All relaxed, with the last 15 minutes at your goal marathon pace.",
      default: "Very slow pace: if you're out of breath, slow down. This is what builds your endurance.",
    },
    easy: {
      title: "Easy run",
      occasional: "Completely relaxed. A 1-min walk break if needed is totally fine.",
      default: "Easy aerobic running: conversational pace, finish feeling fresh.",
    },
    strength: {
      title: "Runner's strength",
      description: "Strengthen what protects your joints and makes your stride more efficient. 1 min rest between sets.",
    },
    ex: {
      legPress: "Leg press",
      goblet: "Goblet squat (dumbbell at chest)",
      squat: "Bodyweight squat",
      stepDown: "Slow step-down from a step",
      wallSit: "Wall sit",
      lungeDb: "Dumbbell reverse lunge",
      lunge: "Alternating reverse lunge",
      rdl: "Romanian deadlift",
      bridge: "Single-leg glute bridge",
      eccentricCalf: "Eccentric calf raises on a step",
      calf: "Calf raises",
      balance: "Single-leg balance (eyes closed if too easy)",
      bandWalk: "Lateral band walk",
      abduction: "Side-lying hip abduction",
      plank: "Plank",
      deadBug: "Dead bug",
      sidePlank: "Side plank",
      row: "Seated row",
      bandRow: "Band row (back)",
      birdDog: "Bird dog",
    },
    cue: {
      squat: "Knees in line with your toes",
      stepDown: "Lower over 3 seconds, knee over your foot",
      rdl: "Flat back, hips back",
      eccentricCalf: "Up on two feet, down on one over 3 s",
      deadBug: "Lower back pressed to the floor",
    },
    perLeg: "/ leg",
    perSide: "/ side",
    perFoot: "/ foot",
    noteAfter: (s) => `Day after ${s.toLowerCase()}: keep this one very easy, it's recovery too.`,
    noteSameDayRun: (s) => `You also have ${s.toLowerCase()} that day: run at a different time and keep it truly easy.`,
    noteSameDayStrength: (s) => `You also have ${s.toLowerCase()} that day: do this at another time of day, or just half the sets.`,
    warnFewDays: (w, r) => `You wanted ${w} runs but only have ${r} days available: the plan includes ${r}.`,
    warnInjury: (l) => `You flagged a weak spot (${l}): progression is gentler and strength work is adapted. If pain keeps coming back, stop and see a professional.`,
    warnCheckup: "If you're coming back after a long break, a quick check-up with your doctor is a good idea.",
    warnHardDays: (d) => `Your intense sport days (${d}) are taken into account: no hard session on those days or the day after when possible.`,
    warnMedical: "This plan doesn't replace medical advice. Listen to your body.",
    intro: (n) => `${n}, here's your first 4-week block. It's built around your real week, other sports included: consistency beats intensity.`,
    tips: [
      "Most of your runs should be easy: that's how you improve without getting injured.",
      "Missed a session? Don't make it up, just pick the plan back up the next day.",
      "Sleep, hydrate and eat enough: recovery is where you get stronger.",
    ],
  },
};
