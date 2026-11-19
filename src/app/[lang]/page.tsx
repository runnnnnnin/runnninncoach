import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountLink } from "@/components/AccountLink";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { hasLocale, type Locale } from "@/i18n/config";
import { UI_TEXT, type UI } from "@/i18n/ui";
import { LABELS } from "@/lib/labels";
import { BRAND, EBOOK } from "@/lib/brand";
import { DAYS } from "@/lib/types";

const WEEK_KINDS = [
  { kind: "run", min: "35" },
  { kind: "other", min: "90", note: "intense" },
  { kind: "strength", min: "30" },
  { kind: "key", min: "45" },
  { kind: "rest" },
  { kind: "other", min: "90", note: "moderate" },
  { kind: "run", min: "60" },
] as const;

const FIGS = [
  { src: "/photos/run.jpg", pos: "50% 55%" },
  { src: "/photos/ride.jpg", pos: "50% 62%" },
  { src: "/photos/swim.jpg", pos: "50% 50%" },
] as const;

function Hero({ t, lang }: { t: UI; lang: Locale }) {
  return (
    <section className="paper-grid relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <nav className="flex items-center justify-between gap-4 py-6">
          <Logo href={`/${lang}`} />
          <div className="flex items-center gap-5 sm:gap-6">
            <Link href={`/${lang}/guide`} className="label text-signal transition hover:text-bone">
              {t.guide.nav}
            </Link>
            <AccountLink lang={lang} />
            <LangSwitch lang={lang} />
            <Link
              href={`/${lang}/create`}
              className="label hidden border-b border-bone pb-1 text-bone transition hover:border-signal hover:text-signal sm:inline"
            >
              {t.nav.cta}
            </Link>
          </div>
        </nav>

        <div className="pb-14 pt-12 sm:pb-20 sm:pt-24">
          <Link
            href={`/${lang}/guide`}
            className="group mb-10 inline-flex w-fit items-center gap-3 border border-bone/20 bg-night px-3.5 py-2 text-xs text-mist transition hover:border-bone hover:text-bone"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            {t.guide.pill}
            <span className="transition group-hover:translate-x-0.5">→</span>
          </Link>
          <p className="label text-fog">{t.hero.kicker}</p>
          <h1 className="serif mt-6 max-w-5xl text-[3.3rem] lowercase leading-[0.92] sm:text-[7rem]">
            {t.hero.title1}
            <em>{t.hero.titleEm}</em>
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-mist">{t.hero.sub}</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={`/${lang}/create`}
              className="group inline-flex items-center justify-between gap-6 bg-bone px-6 py-4 text-sm font-medium text-ink transition hover:bg-mist sm:justify-start"
            >
              {t.hero.cta}
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
            <span className="label flex items-center gap-3 text-fog">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              {t.hero.note}
            </span>
          </div>
        </div>
      </div>

      {/* Photos pleine largeur en bas, comme la story A : une sur mobile, trois sur grand écran */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {FIGS.map((f, i) => (
          <figure key={f.src} className={i > 0 ? "hidden md:block" : ""}>
            <div className="relative aspect-[4/3] bg-asphalt-2 md:aspect-[4/5] lg:aspect-[4/3]">
              <Image src={f.src} alt={t.hero.figs[i]} fill priority={i === 0} sizes="(min-width: 768px) 34vw, 100vw" className="bw object-cover" style={{ objectPosition: f.pos }} />
            </div>
            <figcaption className="label flex justify-between px-4 py-3 text-fog sm:px-8 md:px-5">
              <span>Fig. {String(i + 1).padStart(2, "0")}</span>
              <span>{t.hero.figs[i]}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Manifesto({ t }: { t: UI }) {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-24 sm:px-8 md:grid-cols-[1fr_2fr] md:py-32">
        <p className="label text-fog">{t.manifesto.kicker}</p>
        <p className="serif text-3xl lowercase leading-[1.05] text-bone sm:text-6xl">
          {t.manifesto.a} <span className="text-ash">{t.manifesto.b}</span> <em className="text-bone underline decoration-signal decoration-[0.08em] underline-offset-[0.12em]">{t.manifesto.c}</em>
        </p>
      </div>
    </section>
  );
}

function GuideSection({ t, lang }: { t: UI; lang: Locale }) {
  return (
    <section className="border-t border-hairline bg-asphalt">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-8 md:grid-cols-[1fr_1.2fr] md:py-28">
        <Link href={`/${lang}/guide`} className="mx-auto block w-full max-w-[18rem] transition hover:-translate-y-1 md:max-w-xs">
          <Image
            src="/guide/cover.jpg"
            alt={t.guide.kicker}
            width={900}
            height={1273}
            sizes="(min-width: 768px) 20rem, 18rem"
            className="h-auto w-full shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]"
          />
        </Link>
        <div>
          <p className="label text-fog">
            {t.guide.kicker} · <span className="text-signal">{EBOOK.price}</span>
          </p>
          <h2 className="serif mt-5 text-4xl lowercase leading-[0.98] sm:text-6xl">
            {t.guide.title1}
            <em>{t.guide.em}</em>
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-mist/75">{t.guide.body}</p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={`/${lang}/guide`}
              className="group inline-flex shrink-0 whitespace-nowrap items-center justify-between gap-6 bg-signal px-6 py-4 text-sm font-medium text-white transition hover:brightness-110 sm:justify-start"
            >
              {t.guide.cta}
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
            <span className="label text-fog">{t.guide.facts}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeekSheet({ t, lang }: { t: UI; lang: Locale }) {
  const short = LABELS[lang].daysShort;
  return (
    <section className="border-t border-hairline bg-asphalt">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-8 md:grid-cols-2 md:items-center md:py-32">
        <div>
          <p className="label text-fog">{t.week.kicker}</p>
          <h2 className="serif mt-5 text-4xl lowercase leading-[0.98] sm:text-6xl">
            {t.week.title1}
            <em>{t.week.titleEm}</em>
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-mist/75">{t.week.body}</p>
        </div>
        <div className="border border-hairline bg-night/60">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
            <span className="label text-fog">{t.week.sheet}</span>
            <span className="label text-signal">{t.week.adapted}</span>
          </div>
          <ul>
            {WEEK_KINDS.map((w, i) => (
              <li key={i} className="flex items-center gap-4 border-b border-hairline px-5 py-3.5 last:border-b-0">
                <span className="label w-9 text-fog">{short[DAYS[i]]}</span>
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    w.kind === "key" ? "bg-signal" : w.kind === "strength" ? "bg-klein" : w.kind === "run" ? "bg-bone" : "bg-transparent"
                  }`}
                />
                <span
                  className={`flex-1 text-sm ${w.kind === "other" ? "italic text-fog" : w.kind === "rest" ? "text-fog/60" : "text-bone"}`}
                >
                  {t.week.rows[i]}
                  {"note" in w && <span className="label ml-2 text-fog/70">{t.week.notes[w.note]}</span>}
                </span>
                {"min" in w && <span className="font-mono text-xs text-fog">{w.min}′</span>}
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline px-5 py-4 text-sm leading-relaxed text-mist/80">
            <span className="text-signal">→</span> {t.week.footnote}
          </p>
        </div>
      </div>
    </section>
  );
}

function Process({ t }: { t: UI }) {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-8 md:py-32">
        <p className="label text-fog">{t.process.kicker}</p>
        <div className="mt-12 grid md:grid-cols-3">
          {t.process.steps.map((s, i) => (
            <div key={s.t} className="border-t border-hairline py-8 md:border-l md:border-t-0 md:px-8 md:first:border-l-0 md:first:pl-0">
              <span className="font-mono text-sm text-signal">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="serif mt-4 text-3xl lowercase leading-tight">{s.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist/70">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Audiences({ t }: { t: UI }) {
  const a = t.audiences;
  return (
    <section className="bg-bone text-ink">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-8 md:grid-cols-2 md:py-32">
        {[a.beginner, a.regular].map((x) => (
          <div key={x.k}>
            <p className="label text-ink/55">{x.k}</p>
            <h3 className="serif mt-4 text-4xl lowercase leading-[0.98] sm:text-5xl">
              {x.t1}
              <em>{x.em}</em>
            </h3>
            <p className="mt-5 max-w-sm leading-relaxed text-ink/70">{x.d}</p>
          </div>
        ))}
      </div>
      <div className="relative h-[58vw] max-h-[620px] min-h-[260px]">
        <Image src="/photos/stride.jpg" alt="" fill sizes="100vw" className="bw object-cover" style={{ objectPosition: "50% 62%" }} />
      </div>
    </section>
  );
}

function FinalCta({ t, lang }: { t: UI; lang: Locale }) {
  return (
    <section className="paper-grid">
      <div className="mx-auto max-w-6xl px-4 py-28 sm:px-8 md:py-40">
        <h2 className="serif text-7xl lowercase leading-[0.9] sm:text-[10rem]">
          {t.final.title1}
          <em>{t.final.em}</em>
        </h2>
        <p className="mt-8 max-w-md text-mist">{t.final.body}</p>
        <Link
          href={`/${lang}/create`}
          className="group mt-10 inline-flex items-center gap-6 bg-bone px-7 py-4 text-sm font-medium text-ink transition hover:bg-mist"
        >
          {t.final.cta} <span className="transition group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </section>
  );
}

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return {
    alternates: { canonical: `/${lang}`, languages: { en: "/en", fr: "/fr", "x-default": "/en" } },
    openGraph: { url: `/${lang}` },
  };
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = UI_TEXT[lang];
  return (
    <main className="flex-1">
      <Hero t={t} lang={lang} />
      <Manifesto t={t} />
      <GuideSection t={t} lang={lang} />
      <WeekSheet t={t} lang={lang} />
      <Process t={t} />
      <Audiences t={t} />
      <FinalCta t={t} lang={lang} />
      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo href={`/${lang}`} />
          <div className="flex flex-wrap items-center gap-5">
            <Link href={`/${lang}/pricing`} className="label text-fog hover:text-bone">
              {t.billing.pricingLink}
            </Link>
            <Link href={`/${lang}/guide`} className="label text-fog hover:text-bone">
              {t.guide.kicker}
            </Link>
            <Link href={`/${lang}/terms`} className="label text-fog hover:text-bone">
              {t.billing.terms}
            </Link>
            <Link href={`/${lang}/privacy`} className="label text-fog hover:text-bone">
              {t.footer.privacy}
            </Link>
            <LangSwitch lang={lang} />
            <p className="label text-fog">
              {t.footer.disclaimer} · © {BRAND.name}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
