import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { hasLocale, type Locale } from "@/i18n/config";
import { BRAND, OFFERS, SELLER } from "@/lib/brand";

// Conditions générales de vente (plan complet et abonnement Coach). Le vendeur se règle dans brand.ts (SELLER).

type Section = { t: string; d: string[] };

function sections(lang: Locale): { title: string; updated: string; list: Section[] } {
  const seller = [SELLER.name || BRAND.name, SELLER.siret && `SIRET ${SELLER.siret}`, SELLER.address, BRAND.contactEmail].filter(Boolean).join(" · ");
  if (lang === "fr")
    return {
      title: "Conditions de vente",
      updated: "Mise à jour : 17 novembre 2026",
      list: [
        { t: "Vendeur", d: [seller, ...(SELLER.vatNote ? [SELLER.vatNote] : [])] },
        {
          t: "Offres",
          d: [
            "Gratuit : les 2 premières semaines de chaque plan.",
            `Plan complet : ${OFFERS.plan.price} TTC, paiement unique. Donne accès à un plan en entier, jusqu'à la date de ta course (16 semaines maximum) ou sur 8 semaines sans date de course.`,
            `Coach : ${OFFERS.coach.price} TTC par mois, sans engagement. Donne accès à des plans complets en illimité tant que l'abonnement est actif.`,
          ],
        },
        {
          t: "Paiement",
          d: ["Le paiement se fait sur une page sécurisée de notre prestataire Stripe (carte, Apple Pay, Google Pay, PayPal selon disponibilité). RunFlow ne voit jamais tes coordonnées bancaires. Un reçu t'est envoyé par email."],
        },
        {
          t: "Accès et livraison",
          d: ["Le plan est fourni immédiatement après le paiement, dans ton compte (page Mes plans). Il reste accessible tant que ton compte existe."],
        },
        {
          t: "Droit de rétractation",
          d: [
            "Le plan est un contenu numérique fourni immédiatement. Avant de payer, tu demandes expressément cette exécution immédiate et tu reconnais perdre ton droit de rétractation de 14 jours (article L221-28, 13° du Code de la consommation).",
            "En cas de problème, écris-nous : on cherchera toujours une solution.",
          ],
        },
        {
          t: "Abonnement Coach",
          d: [
            "L'abonnement se renouvelle chaque mois à la même date. Tu peux le résilier à tout moment depuis Mes plans → Gérer mon abonnement : il s'arrête à la fin de la période déjà payée, sans autre prélèvement.",
            "Les plans créés pendant l'abonnement restent dans ton compte après la résiliation.",
          ],
        },
        {
          t: "Santé",
          d: ["RunFlow donne des plans d'entraînement généraux et ne remplace pas un avis médical. En cas de douleur ou de doute sur ta santé, consulte un professionnel avant de continuer."],
        },
        {
          t: "Réclamations et médiation",
          d: [
            `Pour toute réclamation : ${BRAND.contactEmail}. Si aucune solution n'est trouvée, tu peux recourir gratuitement à un médiateur de la consommation, ou à la plateforme européenne de règlement des litiges en ligne : https://ec.europa.eu/consumers/odr.`,
          ],
        },
        { t: "Droit applicable", d: ["Ces conditions sont soumises au droit français."] },
      ],
    };
  return {
    title: "Terms of sale",
    updated: "Last updated: 17 November 2026",
    list: [
      { t: "Seller", d: [seller, ...(SELLER.vatNote ? [SELLER.vatNote] : [])] },
      {
        t: "Offers",
        d: [
          "Free: the first 2 weeks of every plan.",
          `Full plan: ${OFFERS.plan.price} incl. taxes, paid once. Unlocks one whole plan, up to your race date (16 weeks max), or 8 weeks without a race date.`,
          `Coach: ${OFFERS.coach.price} incl. taxes per month, no commitment. Unlimited full plans while the subscription is active.`,
        ],
      },
      {
        t: "Payment",
        d: ["Payment happens on a secure page run by our provider Stripe (card, Apple Pay, Google Pay, PayPal where available). RunFlow never sees your payment details. You get a receipt by email."],
      },
      {
        t: "Access and delivery",
        d: ["Your plan is delivered right after payment, in your account (My plans page). It stays available as long as your account exists."],
      },
      {
        t: "Withdrawal right",
        d: [
          "Plans are digital content delivered immediately. Before paying, you expressly ask for immediate delivery and acknowledge that you lose your 14-day withdrawal right (French Consumer Code, article L221-28, 13°).",
          "If anything goes wrong, write to us: we'll always look for a solution.",
        ],
      },
      {
        t: "Coach subscription",
        d: [
          "The subscription renews every month on the same date. You can cancel at any time from My plans → Manage my subscription: it stops at the end of the period already paid, with no further charge.",
          "Plans created during your subscription stay in your account after you cancel.",
        ],
      },
      {
        t: "Health",
        d: ["RunFlow provides general training plans and is not medical advice. If you feel pain or have doubts about your health, see a professional before continuing."],
      },
      {
        t: "Complaints and mediation",
        d: [
          `For any complaint: ${BRAND.contactEmail}. If we can't find a solution together, you can use a consumer mediator free of charge, or the EU online dispute resolution platform: https://ec.europa.eu/consumers/odr.`,
        ],
      },
      { t: "Governing law", d: ["These terms are governed by French law."] },
    ],
  };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${sections(lang).title} · RunFlow` };
}

export default async function TermsPage({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const s = sections(lang);
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo href={`/${lang}`} />
          <LangSwitch lang={lang} />
        </div>
        <h1 className="serif mt-14 text-5xl leading-none sm:text-6xl">{s.title}</h1>
        <p className="label mt-4 text-fog">{s.updated}</p>
        <div className="mt-10 border-t border-hairline pb-16">
          {s.list.map((x) => (
            <section key={x.t} className="border-b border-hairline py-6">
              <h2 className="text-bone">{x.t}</h2>
              {x.d.map((line) => (
                <p key={line} className="mt-2 text-sm leading-relaxed text-mist/80">
                  {line}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
