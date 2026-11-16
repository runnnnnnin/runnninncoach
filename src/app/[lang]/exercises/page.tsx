import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountLink } from "@/components/AccountLink";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { hasLocale } from "@/i18n/config";
import { ENGINE_TEXT } from "@/lib/engine-text";
import { EXERCISE_GUIDE } from "@/lib/exercise-guide";
import { ExerciseRow } from "../plan/ExerciseGuide";

export async function generateMetadata({ params }: PageProps<"/[lang]/exercises">): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "fr" ? "Les exercices de renfo · RunFlow" : "Strength exercises · RunFlow" };
}

// Tous les exercices de renfo des plans, avec leur mode d'emploi en 3 étapes.
export default async function ExercisesPage({ params }: PageProps<"/[lang]/exercises">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const names = ENGINE_TEXT[lang].ex;
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo href={`/${lang}`} />
          <div className="flex items-center gap-6">
            <AccountLink lang={lang} />
            <LangSwitch lang={lang} />
          </div>
        </div>
        <h1 className="serif mt-14 text-5xl leading-none sm:text-6xl">
          {lang === "fr" ? "Les exercices, " : "Every exercise, "}
          <em className="motion-text">{lang === "fr" ? "en 3 étapes." : "in 3 steps."}</em>
        </h1>
        <p className="mt-5 text-mist/75">
          {lang === "fr"
            ? "Le mode d'emploi de chaque exercice de renforcement de ton plan."
            : "How to do each strength exercise in your plan."}
        </p>
        <ul className="mt-10 border-t border-hairline pb-16 text-sm">
          {Object.keys(EXERCISE_GUIDE).map((key) => (
            <ExerciseRow key={key} e={{ name: names[key], dose: "" }} lang={lang} defaultOpen />
          ))}
        </ul>
      </div>
    </main>
  );
}
