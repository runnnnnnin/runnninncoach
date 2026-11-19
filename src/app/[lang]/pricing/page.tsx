import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountLink } from "@/components/AccountLink";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { hasLocale } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import { BRAND } from "@/lib/brand";
import { Pricing } from "./Pricing";

export async function generateMetadata({ params }: PageProps<"/[lang]/pricing">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = UI_TEXT[lang].billing;
  return {
    title: t.metaTitle,
    description: t.sub,
    alternates: { languages: { en: `${BRAND.siteUrl}/en/pricing`, fr: `${BRAND.siteUrl}/fr/pricing` } },
  };
}

// Les offres : gratuit (2 semaines), plan complet (paiement unique), Coach (abonnement).
export default async function PricingPage({ params }: PageProps<"/[lang]/pricing">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = UI_TEXT[lang].billing;
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
        <header className="pb-12 pt-10 md:pt-16">
          <p className="label text-fog">{t.kicker}</p>
          <h1 className="serif lowercase mt-5 text-[2.9rem] leading-[0.95] sm:text-7xl">
            {t.title1}
            <em className="motion-text">{t.em}</em>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-mist/80">{t.sub}</p>
        </header>
        <Pricing lang={lang} />
      </div>
    </main>
  );
}
