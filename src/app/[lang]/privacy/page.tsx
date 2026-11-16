import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { hasLocale } from "@/i18n/config";
import { UI_TEXT } from "@/i18n/ui";
import { BRAND } from "@/lib/brand";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${hasLocale(lang) ? UI_TEXT[lang].privacy.title : "Privacy"} · ${BRAND.name}` };
}

export default async function Privacy({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = UI_TEXT[lang].privacy;
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo href={`/${lang}`} />
          <LangSwitch lang={lang} />
        </div>
        <h1 className="serif mt-14 text-5xl leading-none sm:text-6xl">{t.title}</h1>
        <p className="mt-5 text-mist/75">{t.intro}</p>
        <div className="mt-12 border-t border-hairline">
          {t.sections.map((s) => (
            <section key={s.t} className="border-b border-hairline py-6">
              <h2 className="label text-fog">{s.t}</h2>
              <p className="mt-3 leading-relaxed">{s.d}</p>
            </section>
          ))}
          <section className="py-6">
            <h2 className="label text-fog">{t.contact}</h2>
            <p className="mt-3 leading-relaxed">
              {BRAND.contactEmail ? (
                <>
                  {t.contactEmail}
                  <a className="underline" href={`mailto:${BRAND.contactEmail}`}>
                    {BRAND.contactEmail}
                  </a>
                  .
                </>
              ) : (
                t.contactSoon
              )}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
