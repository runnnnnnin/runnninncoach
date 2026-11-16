/**
 * Mode d'emploi des exercices de renfo : 3 dessins + 3 consignes par exercice.
 * Chaque dessin est un bonhomme décrit par ses articulations, dans une case de 120 × 110 (sol à y = 100).
 */
import { ENGINE_TEXT } from "./engine-text";

type P = [number, number];
/** Jambe : genou, cheville, et pointe du pied si elle n'est pas simplement devant la cheville. */
type Leg = [P, P] | [P, P, P];
type Arm = [P, P];

export type Prop =
  | ["step", number, number, number, number] // marche ou banc : x, y, largeur, hauteur
  | ["wall", number]
  | ["line", number, number, number, number] // machine, câble
  | ["band", number, number, number, number] // élastique (rouge)
  | ["db", number, number] // haltère
  | ["arrow", number, number, number, number] // sens du mouvement
  | ["guide", number, number, number, number] // alignement à respecter
  | ["label", number, number, string];

export type Pose = {
  h: P; // tête
  s: P; // épaules
  p: P; // bassin
  l1: Leg; // jambe au premier plan
  l2?: Leg;
  a1: Arm; // bras au premier plan : coude, main
  a2?: Arm;
  props?: Prop[];
};

export type Guide = { frames: [Pose, Pose, Pose]; en: [string, string, string]; fr: [string, string, string] };

const with_ = (pose: Pose, change: Partial<Pose>): Pose => ({ ...pose, ...change });
const UP: Prop = ["arrow", 88, 62, 88, 40];
const DOWN: Prop = ["arrow", 88, 40, 88, 62];

// Debout, de profil.
const stand: Pose = { h: [60, 20], s: [60, 33], p: [60, 60], l1: [[61, 80], [60, 100]], l2: [[59, 80], [57, 100]], a1: [[61, 46], [62, 59]] };
const squatLow: Pose = { h: [66, 40], s: [62, 52], p: [46, 74], l1: [[68, 77], [62, 100]], l2: [[66, 78], [59, 100]], a1: [[74, 56], [86, 54]] };
const lungeLow: Pose = { h: [58, 30], s: [58, 43], p: [56, 70], l1: [[70, 80], [68, 100]], l2: [[46, 90], [28, 96], [26, 100]], a1: [[52, 56], [58, 66]] };
const hipsHands: Arm = [[54, 46], [60, 56]];

const stepBox: Prop = ["step", 38, 88, 30, 12];
const stepUp: Pose = { h: [58, 10], s: [58, 23], p: [58, 50], l1: [[59, 69], [58, 88]], l2: [[64, 68], [72, 84], [79, 82]], a1: [[52, 36], [58, 46]], props: [stepBox] };

const calfStep: Prop = ["step", 24, 86, 36, 14];
const calfTop: Pose = { h: [56, 6], s: [56, 19], p: [56, 46], l1: [[57, 65], [56, 82], [62, 86]], l2: [[55, 65], [53, 82], [59, 86]], a1: [[57, 32], [58, 45]], props: [calfStep] };

const bridgeDown: Pose = { h: [16, 92], s: [27, 95], p: [56, 94], l1: [[72, 76], [82, 100]], l2: [[74, 84], [94, 74]], a1: [[40, 97], [52, 98]] };
const sideLying: Pose = { h: [16, 84], s: [28, 90], p: [58, 90], l1: [[76, 88], [96, 88], [98, 82]], l2: [[76, 94], [96, 96], [98, 90]], a1: [[40, 86], [44, 97]], a2: [[18, 96], [12, 88]] };
const plankUp: Pose = { h: [22, 70], s: [32, 76], p: [60, 80], l1: [[78, 86], [96, 94], [98, 99]], a1: [[32, 97], [46, 97]], props: [["guide", 30, 68, 98, 86]] };
const deadBugStart: Pose = { h: [18, 92], s: [28, 95], p: [58, 95], a1: [[28, 80], [28, 66]], a2: [[30, 80], [31, 66]], l1: [[58, 74], [76, 74], [78, 68]], l2: [[60, 74], [78, 75], [80, 69]] };
const sidePlankUp: Pose = { h: [22, 62], s: [30, 74], p: [60, 84], l1: [[78, 90], [96, 96], [98, 91]], a1: [[46, 74], [56, 80]], a2: [[30, 98], [44, 98]], props: [["guide", 28, 66, 98, 88]] };
const allFours: Pose = { h: [94, 60], s: [82, 66], p: [46, 66], a1: [[82, 82], [82, 98]], a2: [[84, 82], [85, 98]], l1: [[46, 98], [26, 98], [22, 94]], l2: [[48, 98], [28, 98], [24, 94]] };

// Vue de face pour la marche latérale : l'élastique est juste au-dessus des genoux.
const bandFront: Pose = { h: [60, 24], s: [60, 37], p: [60, 62], l1: [[52, 80], [50, 100], [46, 100]], l2: [[68, 80], [70, 100], [74, 100]], a1: [[50, 48], [57, 58]], a2: [[70, 48], [63, 58]], props: [["band", 53, 76, 67, 76]] };

const rowBench: Prop[] = [["step", 34, 80, 22, 6], ["line", 104, 30, 104, 100], ["line", 82, 74, 82, 96]];
const rowStart: Pose = { h: [46, 36], s: [46, 49], p: [44, 78], l1: [[64, 74], [80, 86], [82, 78]], a1: [[60, 56], [74, 58]], props: [...rowBench, ["line", 74, 58, 104, 58]] };
const bandPost: Prop = ["line", 106, 30, 106, 100];
const bandRowStart: Pose = { h: [46, 20], s: [46, 33], p: [46, 60], l1: [[49, 80], [46, 100]], l2: [[47, 80], [43, 100]], a1: [[60, 42], [74, 46]], props: [bandPost, ["band", 74, 46, 106, 46]] };

const pressSeat: Prop[] = [["line", 18, 48, 40, 86], ["line", 40, 86, 54, 86]];
const pressBent: Pose = { h: [24, 40], s: [28, 54], p: [42, 82], l1: [[58, 58], [74, 72], [72, 62]], a1: [[36, 70], [44, 80]], props: [...pressSeat, ["line", 72, 56, 80, 80]] };

export const EXERCISE_GUIDE: Record<string, Guide> = {
  squat: {
    frames: [with_(stand, { props: [DOWN] }), squatLow, with_(stand, { props: [UP] })],
    en: ["Stand tall, feet shoulder-width apart.", "Sit back and down as if onto a chair, knees in line with your toes.", "Push through your heels to stand back up."],
    fr: ["Debout, pieds largeur d'épaules.", "Descends les fesses vers l'arrière comme sur une chaise, genoux dans l'axe des pieds.", "Pousse dans les talons pour remonter."],
  },
  goblet: {
    frames: [
      with_(stand, { a1: [[66, 46], [66, 38]], props: [["db", 70, 38], DOWN] }),
      with_(squatLow, { a1: [[66, 62], [70, 54]], props: [["db", 74, 54]] }),
      with_(stand, { a1: [[66, 46], [66, 38]], props: [["db", 70, 38], UP] }),
    ],
    en: ["Hold the dumbbell against your chest, elbows down.", "Squat down between your knees, chest up.", "Drive up through your heels."],
    fr: ["Tiens l'haltère contre ta poitrine, coudes vers le bas.", "Descends entre tes genoux, buste droit.", "Remonte en poussant dans les talons."],
  },
  legPress: {
    frames: [
      with_(pressBent, { props: [...pressSeat, ["line", 72, 56, 80, 80], ["arrow", 58, 40, 80, 40]] }),
      with_(pressBent, { l1: [[68, 72], [92, 70], [90, 60]], props: [...pressSeat, ["line", 90, 54, 98, 78]] }),
      with_(pressBent, { props: [...pressSeat, ["line", 72, 56, 80, 80], ["arrow", 80, 40, 58, 40]] }),
    ],
    en: ["Sit back, feet hip-width on the plate, knees bent.", "Push the plate away without locking your knees.", "Bring it back slowly, under control."],
    fr: ["Dos calé, pieds largeur de hanches sur le plateau, genoux fléchis.", "Pousse le plateau sans verrouiller les genoux.", "Reviens lentement, en contrôlant."],
  },
  stepDown: {
    frames: [
      stepUp,
      { h: [60, 22], s: [58, 35], p: [52, 60], l1: [[66, 74], [58, 88]], l2: [[68, 78], [80, 96], [87, 94]], a1: [[48, 48], [54, 58]], props: [stepBox, ["arrow", 100, 56, 100, 80]] },
      with_(stepUp, { props: [stepBox, ["arrow", 100, 80, 100, 56]] }),
    ],
    en: ["Stand on one leg at the edge of a step.", "Bend that knee slowly (3 seconds) until the other heel brushes the floor.", "Push back up. Keep your knee over your foot."],
    fr: ["Debout sur une jambe au bord d'une marche.", "Plie ce genou lentement (3 secondes) jusqu'à ce que l'autre talon effleure le sol.", "Remonte. Garde le genou au-dessus du pied."],
  },
  wallSit: {
    frames: [
      { h: [41, 20], s: [37, 33], p: [38, 60], l1: [[44, 80], [50, 100]], a1: [[38, 46], [40, 58]], props: [["wall", 30], DOWN] },
      { h: [41, 36], s: [37, 48], p: [38, 74], l1: [[62, 74], [62, 100]], a1: [[46, 60], [56, 68]], props: [["wall", 30]] },
      { h: [41, 36], s: [37, 48], p: [38, 74], l1: [[62, 74], [62, 100]], a1: [[46, 60], [56, 68]], props: [["wall", 30], ["guide", 36, 82, 66, 82], ["label", 92, 56, "30 s"]] },
    ],
    en: ["Stand with your back flat against a wall.", "Slide down until your thighs are parallel to the floor.", "Hold. Knees above ankles, back against the wall."],
    fr: ["Dos à plat contre un mur.", "Glisse vers le bas jusqu'à avoir les cuisses parallèles au sol.", "Tiens. Genoux au-dessus des chevilles, dos contre le mur."],
  },
  lunge: {
    frames: [with_(stand, { a1: hipsHands, props: [["arrow", 50, 92, 30, 92]] }), lungeLow, with_(stand, { a1: hipsHands, props: [UP] })],
    en: ["Stand tall, hands on your hips.", "Step one foot back and lower your back knee towards the floor.", "Push through the front foot to stand up. Switch legs."],
    fr: ["Debout, mains sur les hanches.", "Recule un pied et descends le genou arrière vers le sol.", "Pousse sur le pied avant pour remonter. Change de jambe."],
  },
  lungeDb: {
    frames: [
      with_(stand, { a1: [[60, 46], [60, 60]], props: [["db", 60, 64], ["arrow", 50, 92, 30, 92]] }),
      with_(lungeLow, { a1: [[58, 56], [58, 70]], props: [["db", 58, 74]] }),
      with_(stand, { a1: [[60, 46], [60, 60]], props: [["db", 60, 64], UP] }),
    ],
    en: ["Stand tall, a dumbbell in each hand.", "Step one foot back and lower your back knee towards the floor.", "Push through the front foot to stand up. Keep your chest up."],
    fr: ["Debout, un haltère dans chaque main.", "Recule un pied et descends le genou arrière vers le sol.", "Pousse sur le pied avant pour remonter. Garde le buste droit."],
  },
  rdl: {
    frames: [
      with_(stand, { a1: [[62, 46], [64, 60]], props: [["db", 66, 63], ["arrow", 50, 58, 32, 58]] }),
      { h: [90, 46], s: [78, 50], p: [48, 58], l1: [[58, 79], [58, 100]], l2: [[56, 79], [55, 100]], a1: [[78, 64], [78, 78]], props: [["db", 78, 82], ["guide", 48, 50, 80, 42]] },
      with_(stand, { a1: [[62, 46], [64, 60]], props: [["db", 66, 63], UP] }),
    ],
    en: ["Stand tall, weights in front of your thighs, knees soft.", "Push your hips back and lower the weights along your legs, back flat.", "Squeeze your glutes to stand back up."],
    fr: ["Debout, poids devant les cuisses, genoux souples.", "Recule les hanches et descends les poids le long des jambes, dos plat.", "Serre les fessiers pour te redresser."],
  },
  bridge: {
    frames: [
      with_(bridgeDown, { props: [["arrow", 44, 84, 44, 66]] }),
      with_(bridgeDown, { p: [56, 78], l1: [[72, 74], [82, 100]], l2: [[76, 68], [96, 58]], props: [["guide", 28, 88, 74, 66]] }),
      with_(bridgeDown, { props: [["arrow", 44, 66, 44, 84]] }),
    ],
    en: ["Lie on your back, one foot flat, the other leg straight.", "Push through your heel to lift your hips until your body forms a line.", "Lower slowly. Finish one side, then switch."],
    fr: ["Allongé sur le dos, un pied à plat, l'autre jambe tendue.", "Pousse dans le talon pour lever le bassin jusqu'à former une ligne.", "Redescends lentement. Termine un côté, puis change."],
  },
  eccentricCalf: {
    frames: [
      with_(calfTop, { props: [calfStep, ["arrow", 84, 52, 84, 30]] }),
      with_(calfTop, { l2: [[52, 66], [44, 76], [42, 82]] }),
      { h: [56, 12], s: [56, 25], p: [56, 52], l1: [[57, 71], [54, 91], [62, 86]], l2: [[52, 72], [44, 82], [42, 88]], a1: [[57, 38], [58, 51]], props: [calfStep, ["arrow", 84, 30, 84, 56]] },
    ],
    en: ["Balls of your feet on a step. Rise up on both feet.", "At the top, lift one foot off.", "Lower the heel of the standing foot slowly, over 3 seconds, below the step."],
    fr: ["Avant-pieds sur une marche. Monte sur les deux pieds.", "En haut, décolle un pied.", "Descends le talon du pied d'appui lentement, en 3 secondes, sous la marche."],
  },
  calf: {
    frames: [
      with_(stand, { props: [UP] }),
      { h: [60, 14], s: [60, 27], p: [60, 54], l1: [[61, 74], [60, 93], [67, 100]], l2: [[59, 74], [57, 93], [64, 100]], a1: [[61, 40], [62, 53]] },
      with_(stand, { props: [DOWN] }),
    ],
    en: ["Stand tall, feet hip-width. Hold a wall for balance if needed.", "Rise up onto your toes as high as you can.", "Lower slowly, over 2 to 3 seconds."],
    fr: ["Debout, pieds largeur de hanches. Tiens-toi à un mur si besoin.", "Monte sur la pointe des pieds le plus haut possible.", "Redescends lentement, en 2 à 3 secondes."],
  },
  balance: {
    frames: [
      with_(stand, { a1: [[52, 44], [44, 54]], a2: [[68, 44], [76, 54]] }),
      with_(stand, { a1: [[52, 44], [44, 54]], a2: [[68, 44], [76, 54]], l1: [[60, 80], [60, 100]], l2: [[72, 66], [68, 84], [74, 86]] }),
      with_(stand, { a1: [[52, 44], [44, 54]], a2: [[68, 44], [76, 54]], l1: [[60, 80], [60, 100]], l2: [[72, 66], [68, 84], [74, 86]], props: [["label", 98, 56, "30 s"]] }),
    ],
    en: ["Stand tall, arms slightly out.", "Lift one knee and find your balance.", "Hold without letting your hips drop. Too easy? Close your eyes."],
    fr: ["Debout, bras légèrement écartés.", "Lève un genou et trouve ton équilibre.", "Tiens sans laisser tomber le bassin. Trop facile ? Ferme les yeux."],
  },
  bandWalk: {
    frames: [
      bandFront,
      with_(bandFront, { l2: [[76, 80], [84, 100], [88, 100]], props: [["band", 53, 76, 75, 76], ["arrow", 80, 56, 100, 56]] }),
      { h: [74, 24], s: [74, 37], p: [74, 62], l1: [[66, 80], [64, 100], [60, 100]], l2: [[82, 80], [84, 100], [88, 100]], a1: [[64, 48], [71, 58]], a2: [[84, 48], [77, 58]], props: [["band", 67, 76, 81, 76]] },
    ],
    en: ["Loop the band just above your knees. Bend your knees slightly.", "Step sideways, pushing your knee out against the band.", "Bring the other foot in without letting the band go slack. Keep going, then come back."],
    fr: ["Passe l'élastique juste au-dessus des genoux. Fléchis légèrement.", "Fais un pas de côté en poussant le genou contre l'élastique.", "Ramène l'autre pied sans relâcher la tension. Continue, puis reviens."],
  },
  abduction: {
    frames: [
      with_(sideLying, { props: [["arrow", 106, 84, 106, 64]] }),
      with_(sideLying, { l1: [[74, 78], [92, 66], [95, 60]] }),
      with_(sideLying, { props: [["arrow", 106, 64, 106, 84]] }),
    ],
    en: ["Lie on your side, legs straight, hips stacked.", "Lift the top leg, toes pointing forward, without rolling back.", "Lower slowly. You should feel the side of your hip."],
    fr: ["Allongé sur le côté, jambes tendues, hanches alignées.", "Lève la jambe du dessus, pointe vers l'avant, sans basculer en arrière.", "Redescends lentement. Tu dois sentir le côté de la hanche."],
  },
  plank: {
    frames: [
      { h: [22, 72], s: [32, 78], p: [58, 82], l1: [[74, 97], [94, 97], [96, 92]], a1: [[32, 97], [46, 97]] },
      plankUp,
      with_(plankUp, { props: [["guide", 30, 68, 98, 86], ["label", 62, 54, "30 s"]] }),
    ],
    en: ["Forearms on the floor, elbows under your shoulders, knees down.", "Lift your knees: one straight line from head to heels.", "Hold. Squeeze your glutes and don't let your hips sag."],
    fr: ["Avant-bras au sol, coudes sous les épaules, genoux posés.", "Décolle les genoux : une ligne droite de la tête aux talons.", "Tiens. Serre les fessiers, ne laisse pas le bassin tomber."],
  },
  deadBug: {
    frames: [
      deadBugStart,
      with_(deadBugStart, { a2: [[16, 88], [4, 84]], l1: [[76, 88], [96, 90], [98, 84]] }),
      with_(deadBugStart, { props: [["label", 60, 50, "L / R"]] }),
    ],
    en: ["On your back, arms up, knees bent at 90° above your hips.", "Slowly lower one arm and the opposite leg towards the floor.", "Come back and switch sides. Keep your lower back pressed down."],
    fr: ["Sur le dos, bras tendus vers le haut, genoux à 90° au-dessus des hanches.", "Descends lentement un bras et la jambe opposée vers le sol.", "Reviens et change de côté. Garde le bas du dos collé au sol."],
  },
  sidePlank: {
    frames: [
      { h: [20, 78], s: [30, 86], p: [60, 95], l1: [[78, 96], [96, 97], [98, 92]], a1: [[46, 84], [56, 90]], a2: [[30, 98], [44, 98]] },
      sidePlankUp,
      with_(sidePlankUp, { props: [["guide", 28, 66, 98, 88], ["label", 70, 52, "20 s"]] }),
    ],
    en: ["Lie on your side, elbow under your shoulder, legs straight.", "Lift your hips: one straight line from shoulder to feet.", "Hold, then switch sides. Don't let your hips drop."],
    fr: ["Sur le côté, coude sous l'épaule, jambes tendues.", "Lève le bassin : une ligne droite de l'épaule aux pieds.", "Tiens, puis change de côté. Ne laisse pas le bassin descendre."],
  },
  row: {
    frames: [
      with_(rowStart, { props: [...rowBench, ["line", 74, 58, 104, 58], ["arrow", 84, 22, 64, 22]] }),
      with_(rowStart, { a1: [[38, 62], [54, 60]], props: [...rowBench, ["line", 54, 60, 104, 58]] }),
      with_(rowStart, { props: [...rowBench, ["line", 74, 58, 104, 58], ["arrow", 64, 22, 84, 22]] }),
    ],
    en: ["Sit tall, feet braced, arms straight holding the handle.", "Pull the handle to your belly, elbows close, shoulder blades together.", "Return slowly without rounding your back."],
    fr: ["Assis bien droit, pieds calés, bras tendus sur la poignée.", "Tire la poignée vers le ventre, coudes serrés, omoplates rapprochées.", "Reviens lentement sans arrondir le dos."],
  },
  bandRow: {
    frames: [
      with_(bandRowStart, { props: [bandPost, ["band", 74, 46, 106, 46], ["arrow", 90, 30, 70, 30]] }),
      with_(bandRowStart, { a1: [[36, 48], [52, 46]], props: [bandPost, ["band", 52, 46, 106, 46]] }),
      with_(bandRowStart, { props: [bandPost, ["band", 74, 46, 106, 46], ["arrow", 70, 30, 90, 30]] }),
    ],
    en: ["Fix the band to something solid at chest height (a door handle, a post). Hold it with straight arms.", "Pull your elbows back, squeezing your shoulder blades together.", "Return slowly, keeping the band under tension."],
    fr: ["Fixe l'élastique à un point solide à hauteur de poitrine (poignée de porte, poteau). Tiens-le bras tendus.", "Tire les coudes vers l'arrière en serrant les omoplates.", "Reviens lentement en gardant l'élastique tendu."],
  },
  birdDog: {
    frames: [
      allFours,
      with_(allFours, { a2: [[96, 62], [110, 58]], l1: [[28, 66], [10, 66], [6, 62]] }),
      with_(allFours, { props: [["label", 62, 44, "L / R"]] }),
    ],
    en: ["On all fours, hands under shoulders, knees under hips.", "Reach one arm forward and the opposite leg back, hips level.", "Pause, come back slowly and switch sides."],
    fr: ["À quatre pattes, mains sous les épaules, genoux sous les hanches.", "Tends un bras vers l'avant et la jambe opposée vers l'arrière, bassin stable.", "Marque une pause, reviens lentement et change de côté."],
  },
};

/** Retrouve l'exercice à partir de son nom affiché (les plans enregistrés ne gardent que le nom). */
const BY_NAME = new Map<string, string>();
for (const lang of ["en", "fr"] as const) for (const [key, name] of Object.entries(ENGINE_TEXT[lang].ex)) BY_NAME.set(name, key);

export function guideFor(name: string): Guide | null {
  const key = BY_NAME.get(name);
  return key ? (EXERCISE_GUIDE[key] ?? null) : null;
}
