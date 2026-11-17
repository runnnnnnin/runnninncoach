import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountLink } from "@/components/AccountLink";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { hasLocale, type Locale } from "@/i18n/config";
import { BRAND, EBOOK } from "@/lib/brand";

// Page de vente de l'ebook « Build your own running plan ». Le paiement et l'envoi du PDF
// se font chez la plateforme (Payhip / Gumroad) : ici on présente le guide et on renvoie vers elle.

const TEXT = {
  en: {
    title: "Build your own running plan · the RunFlow guide",
    description: "A 15-page guide to writing your own running plan: how running works, the five runs you need, better form, strength training and a full 10 km plan.",
    kicker: "The RunFlow guide",
    h1: "Build your own ",
    h1em: "running plan.",
    sub: "How running works, the runs that matter, better form and strength work. Everything you need to write your own plan, in 15 short pages.",
    buy: "Get the guide",
    soon: "Available very soon",
    facts: `PDF · ${EBOOK.pages} pages · instant download`,
    insideK: "What's inside",
    inside: [
      ["How running works", "Your engine, and why most runs should be easy"],
      ["How hard is easy?", "The 1–10 effort scale and the talk test"],
      ["The runs you need", "Easy, long, tempo, intervals, strides"],
      ["Sessions to copy", "Ready-made workouts for every level"],
      ["Your stride", "Four cues and three drills"],
      ["Strength training", "Six exercises, twice a week"],
      ["Running and your other sports", "How to fit it all in one week"],
      ["Build your week", "Templates for 3, 4 and 5 runs a week"],
      ["Progress slowly", "How to go from week to week without getting hurt"],
      ["Example: 10 km in 8 weeks", "A full plan you can follow as it is"],
      ["Recovery and warning signs", "Sleep, food, and when to stop"],
      ["Your plan", "A blank week to fill in, plus a checklist"],
    ],
    previewK: "A look inside",
    previewNote: "The rest is in the guide.",
    forK: "Who it's for",
    forList: [
      "You run (or want to start) and want to understand what you're doing, not just follow numbers.",
      "You play other sports and need running and strength to fit around them.",
      "You don't need a watch or a heart-rate monitor: everything works with a simple effort scale.",
    ],
    freeK: "Rather have it done for you?",
    freeT: "RunFlow also writes a free personalised plan around your week and your sports.",
    freeCta: "Create my free plan",
  },
  fr: {
    title: "Construis ton propre plan running · le guide RunFlow",
    description: "Un guide de 15 pages pour écrire ton propre plan : comment marche la course, les cinq séances à connaître, la foulée, le renfo et un plan 10 km complet.",
    kicker: "Le guide RunFlow",
    h1: "Construis ton propre ",
    h1em: "plan running.",
    sub: "Comment marche la course, les séances qui comptent, la foulée et le renfo. Tout ce qu'il faut pour écrire ton propre plan, en 15 pages courtes.",
    buy: "Obtenir le guide",
    soon: "Bientôt disponible",
    facts: `PDF · ${EBOOK.pages} pages · en anglais · téléchargement immédiat`,
    insideK: "Au programme",
    inside: [
      ["Comment marche la course", "Ton moteur, et pourquoi la plupart des sorties sont faciles"],
      ["C'est quoi « facile » ?", "L'échelle d'effort de 1 à 10 et le test de la parole"],
      ["Les séances à connaître", "Footing, sortie longue, tempo, fractionné, accélérations"],
      ["Des séances à copier", "Des séances prêtes pour chaque niveau"],
      ["Ta foulée", "Quatre repères et trois éducatifs"],
      ["Le renfo", "Six exercices, deux fois par semaine"],
      ["La course et tes autres sports", "Tout faire tenir dans une semaine"],
      ["Construire ta semaine", "Des modèles pour 3, 4 et 5 sorties"],
      ["Progresser doucement", "Avancer semaine après semaine sans te blesser"],
      ["Exemple : 10 km en 8 semaines", "Un plan complet à suivre tel quel"],
      ["Récupération et signaux d'alerte", "Sommeil, alimentation, et quand s'arrêter"],
      ["Ton plan", "Une semaine vierge à remplir et une checklist"],
    ],
    previewK: "Un aperçu",
    previewNote: "La suite est dans le guide.",
    forK: "Pour qui",
    forList: [
      "Tu cours (ou tu veux t'y mettre) et tu veux comprendre ce que tu fais, pas juste suivre des chiffres.",
      "Tu fais d'autres sports et la course et le renfo doivent s'organiser autour.",
      "Pas besoin de montre ni de cardio : tout marche avec une simple échelle d'effort.",
    ],
    freeK: "Tu préfères qu'on le fasse pour toi ?",
    freeT: "RunFlow écrit aussi un plan personnalisé gratuit, autour de ta semaine et de tes sports.",
    freeCta: "Créer mon plan gratuit",
  },
} satisfies Record<Locale, unknown>;

export async function generateMetadata({ params }: PageProps<"/[lang]/guide">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = TEXT[lang];
  return {
    title: t.title,
    description: t.description,
    alternates: { languages: { en: `${BRAND.siteUrl}/en/guide`, fr: `${BRAND.siteUrl}/fr/guide` } },
    openGraph: { title: t.title, description: t.description, images: [{ url: "/guide/cover.jpg", width: 900, height: 1273 }] },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: ["/guide/cover.jpg"] },
  };
}

function BuyButton({ label, soon }: { label: string; soon: string }) {
  if (!EBOOK.checkoutUrl) {
    return <span className="inline-flex cursor-default items-center bg-asphalt-2 px-6 py-4 text-sm font-medium text-fog">{soon}</span>;
  }
  return (
    <a
      href={EBOOK.checkoutUrl}
      className="group inline-flex items-center justify-between gap-6 bg-signal px-6 py-4 text-sm font-medium text-white transition hover:brightness-110 sm:justify-start"
    >
      {label} · {EBOOK.price}
      <span className="transition group-hover:translate-x-1">→</span>
    </a>
  );
}

export default async function GuidePage({ params }: PageProps<"/[lang]/guide">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = TEXT[lang];

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <nav className="flex items-center justify-between gap-4 py-6">
          <Logo href={`/${lang}`} />
          <div className="flex items-center gap-6">
            <AccountLink lang={lang} />
            <LangSwitch lang={lang} />
          </div>
        </nav>

        {/* Couverture + achat */}
        <section className="grid items-center gap-12 pb-20 pt-8 md:grid-cols-[1.1fr_1fr] md:pt-14">
          <div>
            <p className="label text-fog">{t.kicker}</p>
            <h1 className="serif mt-5 text-[2.9rem] leading-[0.95] sm:text-7xl">
              {t.h1}
              <em className="motion-text">{t.h1em}</em>
            </h1>
            <p className="mt-7 max-w-md leading-relaxed text-mist/80">{t.sub}</p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <BuyButton label={t.buy} soon={t.soon} />
              <span className="label text-fog">{t.facts}</span>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm md:max-w-md">
            <Image
              src="/guide/cover.jpg"
              alt={t.kicker}
              width={900}
              height={1273}
              priority
              sizes="(min-width: 768px) 28rem, 90vw"
              className="h-auto w-full shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
            />
          </div>
        </section>
      </div>

      {/* Sommaire */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <p className="label text-fog">{t.insideK}</p>
          <ol className="mt-10 grid gap-x-12 md:grid-cols-2">
            {t.inside.map(([title, desc], i) => (
              <li key={title} className="flex gap-5 border-t border-hairline py-4">
                <span className="font-mono text-sm text-signal">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-bone">{title}</p>
                  <p className="mt-1 text-sm text-fog">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Aperçu de trois pages */}
      <section className="border-t border-hairline bg-asphalt">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <p className="label text-fog">{t.previewK}</p>
          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-6">
            {["runs", "week", "plan"].map((p) => (
              <Image
                key={p}
                src={`/guide/preview-${p}.jpg`}
                alt=""
                width={600}
                height={849}
                sizes="(min-width: 1152px) 22rem, 31vw"
                className="h-auto w-full"
              />
            ))}
          </div>
          <p className="label mt-8 text-center text-fog">{t.previewNote}</p>
        </div>
      </section>

      {/* Pour qui + achat */}
      <section className="border-t border-hairline">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-8 md:grid-cols-[1fr_2fr]">
          <p className="label text-fog">{t.forK}</p>
          <div>
            <ul className="space-y-5">
              {t.forList.map((x) => (
                <li key={x} className="flex gap-4 leading-relaxed text-mist/85">
                  <span className="text-signal">→</span>
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <BuyButton label={t.buy} soon={t.soon} />
            </div>
          </div>
        </div>
      </section>

      {/* L'alternative gratuite */}
      <section className="border-t border-hairline bg-bone text-ink">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="label text-ink/50">{t.freeK}</p>
            <p className="serif mt-3 max-w-xl text-3xl leading-tight">{t.freeT}</p>
          </div>
          <Link
            href={`/${lang}/create`}
            className="group inline-flex shrink-0 items-center gap-6 bg-ink px-6 py-4 text-sm font-medium text-bone transition hover:bg-black"
          >
            {t.freeCta}
            <span className="transition group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
