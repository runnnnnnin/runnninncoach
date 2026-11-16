import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, LOCALES } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import { fontVars } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = UI_TEXT[lang].meta;
  return {
    title: t.title,
    description: t.description,
    alternates: { languages: { en: "/en", fr: "/fr" } },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <html lang={lang} className={`${fontVars} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
