import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { hasLocale } from "@/i18n/config";
import { MyPlans } from "./MyPlans";

export async function generateMetadata({ params }: PageProps<"/[lang]/plans">): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "fr" ? "Mes plans · RunFlow" : "My plans · RunFlow", robots: { index: false } };
}

export default async function PlansPage({ params }: PageProps<"/[lang]/plans">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo href={`/${lang}`} />
          <LangSwitch lang={lang} />
        </div>
        <div className="mt-14 pb-16">
          <MyPlans lang={lang} />
        </div>
      </div>
    </main>
  );
}
