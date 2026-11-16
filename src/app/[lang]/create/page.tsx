import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { hasLocale } from "@/i18n/config";
import { Questionnaire } from "./Questionnaire";

export async function generateMetadata({ params }: PageProps<"/[lang]/create">): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "fr" ? "Crée ton plan · RunFlow" : "Create your plan · RunFlow" };
}

export default async function Create({ params }: PageProps<"/[lang]/create">) {
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
          <Questionnaire lang={lang} />
        </div>
      </div>
    </main>
  );
}
