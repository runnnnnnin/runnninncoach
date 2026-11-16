import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { hasLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[lang]/signup">): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "fr" ? "Créer un compte · RunFlow" : "Create account · RunFlow", robots: { index: false } };
}

export default async function SignupPage({ params }: PageProps<"/[lang]/signup">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-md px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo href={`/${lang}`} />
          <LangSwitch lang={lang} />
        </div>
        <div className="mt-16 pb-16">
          <AuthForm lang={lang} mode="signup" />
        </div>
      </div>
    </main>
  );
}
