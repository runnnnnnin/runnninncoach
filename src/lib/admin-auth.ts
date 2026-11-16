import { createHash, timingSafeEqual } from "node:crypto";

// Accès à la page /admin : mot de passe défini dans Vercel (variable ADMIN_PASSWORD), jamais dans le code.
export const ADMIN_COOKIE = "rf_admin";

export const adminPasswordSet = () => Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 10);

export function adminToken() {
  return createHash("sha256").update(`runflow-admin:${process.env.ADMIN_PASSWORD ?? ""}`).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
