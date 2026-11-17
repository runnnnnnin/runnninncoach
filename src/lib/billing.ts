/**
 * Paiements RunFlow avec Stripe : plan complet (paiement unique) et abonnement Coach (mensuel).
 * Sans STRIPE_SECRET_KEY, rien n'est payant : tous les plans sont complets, comme avant.
 *
 * Pas de webhook : l'état est relu chez Stripe (au retour du paiement, et au plus toutes les 10 minutes),
 * et les paiements uniques déjà payés sont rattrapés même si la page de retour n'a jamais été ouverte.
 */
import Stripe from "stripe";
import type { Locale } from "@/i18n/config";
import { OFFERS } from "./brand";
import {
  dbConfigured,
  getBilling,
  planCredits,
  recordPurchase,
  saveCustomer,
  saveSubscription,
  type User,
} from "./db";

export const billingConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY) && dbConfigured();

let _stripe: Stripe | null = null;
export function stripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

/** Statuts Stripe pour lesquels l'abonnement donne accès (past_due : le paiement est en cours de relance). */
const ACTIVE = new Set(["active", "trialing", "past_due"]);
const REFRESH_MS = 10 * 60_000;

export type Kind = "plan" | "coach";

export type Access = {
  /** Les paiements sont branchés (sinon tout est gratuit). */
  available: boolean;
  coach: boolean;
  coachUntil: string | null;
  cancelAtEnd: boolean;
  /** Plans complets achetés pas encore utilisés. */
  credits: number;
  /** Un client Stripe existe (pour afficher « Gérer mon abonnement »). */
  customer: boolean;
};

const NONE: Access = { available: false, coach: false, coachUntil: null, cancelAtEnd: false, credits: 0, customer: false };

export async function ensureCustomer(user: User) {
  const b = await getBilling(user.id);
  if (b?.customer_id) return b.customer_id;
  const c = await stripe().customers.create({
    email: user.email,
    ...(user.first_name ? { name: user.first_name } : {}),
    metadata: { user_id: user.id },
  });
  await saveCustomer(user.id, c.id);
  return c.id;
}

/** Relit l'abonnement et les paiements uniques chez Stripe. */
export async function syncBilling(userId: string, force = false) {
  const b = await getBilling(userId);
  if (!b?.customer_id) return;
  if (!force && b.checked_at && Date.now() - new Date(b.checked_at).getTime() < REFRESH_MS) return;
  const st = stripe();

  const subs = await st.subscriptions.list({ customer: b.customer_id, status: "all", limit: 10 });
  const sub = subs.data.find((x) => ACTIVE.has(x.status)) ?? subs.data[0];
  const end = sub?.items.data[0]?.current_period_end ?? null;
  await saveSubscription(userId, {
    id: sub?.id ?? null,
    status: sub?.status ?? null,
    end: end ? new Date(end * 1000).toISOString() : null,
    cancelAtEnd: Boolean(sub?.cancel_at_period_end || sub?.cancel_at),
  });

  const sessions = await st.checkout.sessions.list({ customer: b.customer_id, limit: 100 });
  for (const cs of sessions.data) await recordIfPaid(cs, userId);
}

/** Enregistre un paiement unique payé appartenant à ce compte. */
export async function recordIfPaid(cs: Stripe.Checkout.Session, userId: string) {
  if (cs.mode !== "payment" || cs.payment_status !== "paid") return false;
  if (cs.metadata?.kind !== "plan" || cs.metadata?.user_id !== userId) return false;
  await recordPurchase({ sessionId: cs.id, userId, kind: "plan", amount: cs.amount_total });
  return true;
}

export async function accessOf(userId: string): Promise<Access> {
  if (!billingConfigured()) return NONE;
  try {
    await syncBilling(userId);
  } catch (e) {
    console.error("[RunFlow] Lecture Stripe impossible :", e);
  }
  const b = await getBilling(userId).catch(() => null);
  const graceOk = !b?.sub_end || new Date(b.sub_end).getTime() > Date.now() - 3 * 86_400_000;
  return {
    available: true,
    coach: Boolean(b?.sub_status && ACTIVE.has(b.sub_status) && graceOk),
    coachUntil: b?.sub_end ?? null,
    cancelAtEnd: b?.sub_cancel_at_end ?? false,
    credits: await planCredits(userId).catch(() => 0),
    customer: Boolean(b?.customer_id),
  };
}

const NAMES: Record<Locale, Record<Kind, { name: string; description: string }>> = {
  en: {
    plan: { name: "RunFlow · Full plan", description: "Your complete personalised plan, up to race day." },
    coach: { name: "RunFlow Coach", description: "Unlimited full plans, rebuild yours any time, weekly follow-up." },
  },
  fr: {
    plan: { name: "RunFlow · Plan complet", description: "Ton plan personnalisé en entier, jusqu'au jour de ta course." },
    coach: { name: "RunFlow Coach", description: "Plans complets illimités, refais ton plan quand tu veux, suivi chaque semaine." },
  },
};

/** Page de paiement Stripe (carte, PayPal, Apple Pay… selon les moyens activés dans Stripe). */
export async function createCheckout(user: User, kind: Kind, opts: { planId?: string; lang: Locale; origin: string }) {
  const customer = await ensureCustomer(user);
  const meta = { user_id: user.id, kind, plan_id: opts.planId ?? "", withdrawal_waiver: "accepted" };
  const n = NAMES[opts.lang][kind];
  const session = await stripe().checkout.sessions.create({
    mode: kind === "plan" ? "payment" : "subscription",
    customer,
    client_reference_id: user.id,
    locale: opts.lang,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: OFFERS[kind].cents,
          product_data: { name: n.name, description: n.description },
          ...(kind === "coach" ? { recurring: { interval: "month" as const } } : {}),
        },
      },
    ],
    metadata: meta,
    ...(kind === "coach" ? { subscription_data: { metadata: meta } } : { payment_intent_data: { metadata: meta } }),
    allow_promotion_codes: true,
    success_url: `${opts.origin}/api/billing/return?session_id={CHECKOUT_SESSION_ID}&lang=${opts.lang}`,
    cancel_url: `${opts.origin}/${opts.lang}/pricing${opts.planId ? `?plan=${opts.planId}` : ""}`,
  });
  return session.url;
}

/** Espace client Stripe : changer de carte, voir les factures, résilier. */
export async function portalUrl(user: User, returnUrl: string) {
  const customer = await ensureCustomer(user);
  const s = await stripe().billingPortal.sessions.create({ customer, return_url: returnUrl });
  return s.url;
}
