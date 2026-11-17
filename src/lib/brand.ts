// Nom et slogan de la marque : à changer ici seulement si le nom change.
export const BRAND = {
  name: "RunFlow",
  // Adresse officielle du site (domaine acheté le 2026-11-16).
  siteUrl: "https://www.runflowcoach.com",
  tagline: "Trouve ton flow.",
  pitch: "Le coach running + renfo qui connaît tous tes sports.",
  // Adresse de contact affichée sur la page Confidentialité (à remplir).
  contactEmail: "runflowcoach@gmail.com",
};

// L'ebook « Build your own running plan » (page /guide).
// checkoutUrl : le lien de paiement Payhip / Gumroad. Tant qu'il est vide, le bouton affiche « bientôt disponible ».
export const EBOOK = {
  checkoutUrl: "https://runflow8.gumroad.com/l/xclfqo",
  price: "€9.99",
  pages: 15,
};

// Offres payantes (paiement par Stripe). Les prix affichés et les montants facturés viennent d'ici.
export const OFFERS = {
  /** Plan complet, paiement unique : tout le plan jusqu'à la course (16 semaines max), 8 semaines sans course. */
  plan: { cents: 1499, price: "€14.99" },
  /** Abonnement Coach, mensuel : plans complets illimités et suivi. */
  coach: { cents: 799, price: "€7.99" },
};

// Vendeur affiché dans les conditions de vente (obligatoire en France). À compléter avec le SIRET.
export const SELLER = {
  name: "",
  siret: "",
  address: "",
  /** Ex. « TVA non applicable, art. 293 B du CGI » en franchise de TVA. */
  vatNote: "",
};

