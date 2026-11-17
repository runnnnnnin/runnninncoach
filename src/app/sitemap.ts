import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/create", "/guide", "/privacy"];
  return pages.flatMap((p) =>
    (["en", "fr"] as const).map((lang) => ({
      url: `${BRAND.siteUrl}/${lang}${p}`,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.6,
      alternates: { languages: { en: `${BRAND.siteUrl}/en${p}`, fr: `${BRAND.siteUrl}/fr${p}` } },
    })),
  );
}
