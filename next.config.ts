import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Anglais par défaut ; les anciennes adresses françaises restent valides.
  async redirects() {
    return [
      { source: "/", destination: "/en", permanent: false },
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
