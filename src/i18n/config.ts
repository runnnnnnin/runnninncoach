export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const hasLocale = (l: string): l is Locale => (LOCALES as readonly string[]).includes(l);
export const otherLocale = (l: Locale): Locale => (l === "en" ? "fr" : "en");
