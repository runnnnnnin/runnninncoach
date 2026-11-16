"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminPasswordSet, adminToken, safeEqual } from "@/lib/admin-auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  // Petit délai pour ralentir les essais en série.
  await new Promise((r) => setTimeout(r, 600));
  if (!adminPasswordSet() || !safeEqual(password, process.env.ADMIN_PASSWORD!)) {
    redirect("/admin?erreur=1");
  }
  (await cookies()).set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin");
}
