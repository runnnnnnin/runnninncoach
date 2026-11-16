import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MotionRunner } from "@/components/MotionRunner";
import { BRAND } from "@/lib/brand";

const WEEK = [
  { d: "Lun", what: "Footing facile", min: "35", kind: "run" },
  { d: "Mar", what: "Foot", min: "90", kind: "other", note: "intense" },
  { d: "Mer", what: "Renfo du coureur", min: "30", kind: "strength" },
  { d: "Jeu", what: "Fractionné", min: "45", kind: "key" },
  { d: "Ven", what: "Repos", kind: "rest" },
  { d: "Sam", what: "Padel", min: "90", kind: "other", note: "modéré" },
  { d: "Dim", what: "Sortie longue", min: "60", kind: "run" },
] as const;

function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden">
      {/* Ciel de fin de journée, brume, lampadaires */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#0c1633_0%,#121a2b_38%,#0d0f13_70%,#0a0b0d_100%)]" />
      <div className="absolute -top-40 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-mist/10 blur-3xl" />
      <div className="absolute right-[12%] top-[16%] -z-10 h-3 w-10 rounded-full bg-white/80 blur-[6px]" />
      <div className="absolute right-[24%] top-[22%] -z-10 h-2 w-6 rounded-full bg-white/60 blur-[5px]" />
      <div className="absolute left-[8%] top-[28%] -z-10 h-2 w-8 rounded-full bg-white/40 blur-[6px]" />

      {/* Piste */}
      <svg className="absolute inset-x-0 bottom-0 -z-10 h-[46%] w-full" viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="track" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a1410" stopOpacity="0" />
            <stop offset="0.5" stopColor="#5a1a12" stopOpacity="0.55" />
            <stop offset="1" stopColor="#2a0d09" stopOpacity="0.9" />
          </linearGradient>
          <filter id="soft">
            <feGaussianBlur stdDeviation="2.2 0.6" />
          </filter>
        </defs>
        <path d="M0 120 Q 720 60 1440 140 L1440 400 L0 400 Z" fill="url(#track)" />
        <g stroke="#ece8df" strokeOpacity="0.5" fill="none" filter="url(#soft)">
          <path d="M0 170 Q 720 100 1440 190" strokeWidth="2" />
          <path d="M0 240 Q 720 160 1440 260" strokeWidth="2.5" />
          <path d="M0 330 Q 720 240 1440 350" strokeWidth="3" />
        </g>
      </svg>

      {/* Coureur en mouvement */}
      <div className="streak absolute bottom-[14%] right-[-6%] -z-10 w-[78%] max-w-[760px] text-[#05070b] sm:right-[2%] sm:w-[52%]">
        <MotionRunner color="#05070b" blur={7} ghosts={3} />
      </div>

      <div className="mx-auto flex min-h-[100svh] max-w-6xl flex-col px-4 sm:px-8">
        <nav className="flex items-center justify-between py-6">
          <Logo />
          <Link href="/commencer" className="label border-b border-bone/40 pb-1 text-bone/80 transition hover:border-bone hover:text-bone">
            Créer mon plan
          </Link>
        </nav>

        <div className="flex flex-1 flex-col justify-center pb-40 pt-10">
          <p className="label text-fog">N°01 · Course · Renfo · Récup</p>
          <h1 className="serif mt-6 max-w-4xl text-[3.2rem] leading-[0.95] sm:text-[6.2rem]">
            Le coach running qui connaît <em className="motion-text">tous tes sports.</em>
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-mist/80">
            Course, renfo et récup construits autour de ta vraie semaine : le foot du mardi, le padel du samedi, et la vie entre
            les deux.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/commencer"
              className="group inline-flex items-center justify-between gap-6 bg-bone px-6 py-4 text-sm font-medium text-ink transition hover:bg-white sm:justify-start"
            >
              Créer mon plan gratuit
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
            <span className="label text-fog">3 min · gratuit pendant la phase de test</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-24 sm:px-8 md:grid-cols-[1fr_2fr] md:py-32">
        <p className="label text-fog">Pourquoi {BRAND.name}</p>
        <p className="serif text-3xl leading-[1.15] text-bone sm:text-5xl">
          Tu as foot le mardi. Padel le samedi. Une vie entre les deux.{" "}
          <span className="text-fog">Les autres applis l&apos;ignorent et te mettent un fractionné le lendemain du match.</span>{" "}
          <em>Ton plan, lui, le sait.</em>
        </p>
      </div>
    </section>
  );
}

function WeekSheet() {
  return (
    <section className="border-t border-hairline bg-asphalt">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-8 md:grid-cols-2 md:items-center md:py-32">
        <div>
          <p className="label text-fog">Une semaine type</p>
          <h2 className="serif mt-5 text-4xl leading-[1.05] sm:text-6xl">
            Chaque séance <em>à sa place.</em>
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-mist/75">
            Pas de séance dure le jour d&apos;un match ni le lendemain. La sortie longue quand tu as le temps. Le renfo loin des
            séances clés. Une progression douce, et une semaine allégée pour assimiler.
          </p>
        </div>
        <div className="border border-hairline bg-night/60">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
            <span className="label text-fog">Semaine 02 · On construit</span>
            <span className="label text-signal">● Adapté</span>
          </div>
          <ul>
            {WEEK.map((w) => (
              <li key={w.d} className="flex items-center gap-4 border-b border-hairline px-5 py-3.5 last:border-b-0">
                <span className="label w-9 text-fog">{w.d}</span>
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    w.kind === "key" ? "bg-signal" : w.kind === "strength" ? "bg-klein" : w.kind === "run" ? "bg-bone" : "bg-transparent"
                  }`}
                />
                <span
                  className={`flex-1 text-sm ${
                    w.kind === "other" ? "italic text-fog" : w.kind === "rest" ? "text-fog/60" : "text-bone"
                  }`}
                >
                  {w.what}
                  {"note" in w && <span className="label ml-2 text-fog/70">{w.note}</span>}
                </span>
                {"min" in w && <span className="font-mono text-xs text-fog">{w.min}′</span>}
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline px-5 py-4 text-sm leading-relaxed text-mist/80">
            <span className="text-signal">→</span> Pas de fractionné mercredi : tu sors d&apos;un match de foot. On le décale à jeudi.
          </p>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", t: "Tu racontes ta semaine", d: "Ton objectif, ton niveau, tes jours libres et les autres sports que tu pratiques." },
  { n: "02", t: "Ton coach construit ton plan", d: "Course, renfo et récup placés autour de ton foot, ton padel, ton vélo." },
  { n: "03", t: "Tu progresses sans te blesser", d: "Une charge qui monte doucement, semaine après semaine." },
];

function Process() {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-8 md:py-32">
        <p className="label text-fog">Comment ça marche</p>
        <div className="mt-12 grid md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t border-hairline py-8 md:border-l md:border-t-0 md:px-8 md:first:border-l-0 md:first:pl-0">
              <span className="font-mono text-sm text-signal">{s.n}</span>
              <h3 className="serif mt-4 text-3xl leading-tight">{s.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist/70">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PaintedHill() {
  return (
    <section className="relative overflow-hidden bg-bone text-ink">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-72 pt-24 sm:px-8 md:grid-cols-2 md:pb-80 md:pt-32">
        <div>
          <p className="label text-ink/50">Tu débutes</p>
          <h3 className="serif mt-4 text-4xl leading-[1.05] sm:text-5xl">
            De « je ne cours pas » à <em>ton premier 5 km.</em>
          </h3>
          <p className="mt-5 max-w-sm leading-relaxed text-ink/65">
            Marche-course progressive, renfo simple au poids du corps, des explications claires. Zéro pression.
          </p>
        </div>
        <div>
          <p className="label text-ink/50">Tu cours déjà</p>
          <h3 className="serif mt-4 text-4xl leading-[1.05] sm:text-5xl">
            Passe un cap <em>sans sacrifier le reste.</em>
          </h3>
          <p className="mt-5 max-w-sm leading-relaxed text-ink/65">
            10 km, semi, marathon ou trail : fractionné, seuil et sortie longue là où ton corps peut les encaisser.
          </p>
        </div>
      </div>
      {/* Colline peinte au bleu Klein + petit coureur */}
      <svg className="absolute inset-x-0 bottom-0 h-64 w-full md:h-72" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden>
        <defs>
          <filter id="brush" x="-5%" y="-20%" width="110%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.18" numOctaves="3" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="14" />
          </filter>
          <linearGradient id="klein" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f35d6" />
            <stop offset="1" stopColor="#0c1c8f" />
          </linearGradient>
        </defs>
        <path d="M-20 210 L 1460 70 L 1460 320 L -20 320 Z" fill="url(#klein)" filter="url(#brush)" />
      </svg>
      <div className="absolute bottom-[150px] left-[34%] w-20 text-klein sm:w-24 md:bottom-[190px]">
        <MotionRunner color="#1f35d6" blur={2.2} ghosts={1} />
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,203,207,0.16),transparent_60%)]" />
      <div className="mx-auto max-w-6xl px-4 py-28 text-center sm:px-8 md:py-40">
        <h2 className="serif text-6xl leading-none sm:text-9xl">
          Trouve ton <em className="motion-text">flow.</em>
        </h2>
        <p className="mx-auto mt-8 max-w-md text-mist/75">
          Ton premier bloc de 4 semaines, gratuit, en 3 minutes. On cherche nos premiers testeurs : ton avis compte.
        </p>
        <Link
          href="/commencer"
          className="group mt-10 inline-flex items-center gap-6 bg-bone px-7 py-4 text-sm font-medium text-ink transition hover:bg-white"
        >
          Créer mon plan gratuit <span className="transition group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <Manifesto />
      <WeekSheet />
      <Process />
      <PaintedHill />
      <FinalCta />
      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo />
          <p className="label text-fog">Ne remplace pas un avis médical · © {BRAND.name}</p>
        </div>
      </footer>
    </main>
  );
}
