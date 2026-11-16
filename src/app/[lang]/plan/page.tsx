import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountLink } from "@/components/AccountLink";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { hasLocale } from "@/i18n/config";
import { PlanView } from "./PlanView";

export async function generateMetadata({ params }: PageProps<"/[lang]/plan">): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "fr" ? "Ton plan · RunFlow" : "Your plan · RunFlow" };
}

export default async function PlanPage({ params }: PageProps<"/[lang]/plan">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="no-print flex items-center justify-between">
          <Logo href={`/${lang}`} />
          <div className="flex items-center gap-6">
            <AccountLink lang={lang} />
            <LangSwitch lang={lang} />
          </div>
        </div>
        <div className="mt-8 pb-16">
          <PlanView lang={lang} />
        </div>
      </div>
    </main>
  );
}
