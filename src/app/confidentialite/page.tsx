import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: `Confidentialité · ${BRAND.name}` };

const SECTIONS = [
  {
    t: "Ce que nous collectons",
    d: "Ton prénom, ton email, tes réponses au questionnaire (objectif, niveau, disponibilités, autres sports, matériel, zones fragiles) et, si tu nous les donnes, tes retours hebdomadaires.",
  },
  {
    t: "Pourquoi",
    d: "Pour créer ton plan, te permettre de le retrouver et améliorer RunFlow pendant la phase de test. Si tu l'as accepté, pour t'envoyer des nouvelles de RunFlow.",
  },
  {
    t: "Avec qui",
    d: "Personne ne nous achète tes données. Elles sont hébergées par nos prestataires techniques (Vercel pour le site, Neon pour la base de données) et tes réponses sont transmises à un modèle d'IA (Anthropic, via Vercel) uniquement pour rédiger ton plan.",
  },
  {
    t: "Combien de temps",
    d: "Pendant la phase de test, puis au maximum 3 ans après ton dernier contact avec nous.",
  },
  {
    t: "Tes droits",
    d: "Tu peux demander à consulter, corriger ou supprimer tes données, et te désinscrire des nouvelles à tout moment.",
  },
];

export default function Confidentialite() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Logo />
        <h1 className="serif mt-14 text-5xl leading-none sm:text-6xl">Confidentialité</h1>
        <p className="mt-5 text-mist/75">Simple et transparent : voici ce que {BRAND.name} fait de tes données.</p>
        <div className="mt-12 border-t border-hairline">
          {SECTIONS.map((s) => (
            <section key={s.t} className="border-b border-hairline py-6">
              <h2 className="label text-fog">{s.t}</h2>
              <p className="mt-3 leading-relaxed">{s.d}</p>
            </section>
          ))}
          <section className="py-6">
            <h2 className="label text-fog">Nous contacter</h2>
            <p className="mt-3 leading-relaxed">
              {BRAND.contactEmail ? (
                <>
                  Écris-nous à{" "}
                  <a className="underline" href={`mailto:${BRAND.contactEmail}`}>
                    {BRAND.contactEmail}
                  </a>
                  .
                </>
              ) : (
                "Une adresse de contact sera bientôt indiquée ici."
              )}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
