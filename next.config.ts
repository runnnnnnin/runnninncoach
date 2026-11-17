import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Anglais par défaut ; les anciennes adresses françaises restent valides.
  async redirects() {
    return [
      // L'ancienne adresse vercel.app renvoie vers le domaine officiel.
      {
        source: "/:path*",
        has: [{ type: "host", value: "runnninncoach.vercel.app" }],
        destination: "https://www.runflowcoach.com/:path*",
        permanent: true,
      },
      { source: "/", destination: "/en", permanent: false },
      // Lien court pour la bio Instagram / TikTok.
      { source: "/guide", destination: "/en/guide", permanent: false },
      { source: "/ebook", destination: "/en/guide", permanent: false },
      { source: "/commencer", destination: "/fr/create", permanent: true },
      { source: "/plan", destination: "/fr/plan", permanent: true },
      { source: "/confidentialite", destination: "/fr/privacy", permanent: true },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
