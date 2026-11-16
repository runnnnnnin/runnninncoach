/**
 * Comptes RunFlow : email + mot de passe.
 * Le mot de passe n'est jamais stocké : seulement son empreinte (scrypt, avec un sel par compte).
 * La connexion tient dans un cookie illisible par JavaScript ; la base ne garde que l'empreinte du jeton.
 */
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { promisify } from "node:util";
import { createSession, dbConfigured, deleteSession, userBySession, type User } from "./db";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
export const SESSION_COOKIE = "rf_session";
const SESSION_DAYS = 60;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return ["scrypt", salt.toString("hex"), hash.toString("hex")].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Ouvre une session et pose le cookie. */
export async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await createSession(tokenHash(token), userId, SESSION_DAYS);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && dbConfigured()) await deleteSession(tokenHash(token)).catch(() => {});
  jar.delete(SESSION_COOKIE);
}

/** L'utilisateur connecté, ou null. */
export async function currentUser(): Promise<User | null> {
  if (!dbConfigured()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  return userBySession(tokenHash(token)).catch(() => null);
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
