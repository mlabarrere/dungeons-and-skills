import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redirection racine déterministe (indépendante du matcher edge du proxy) :
  // "/" -> "/fr". Ajouter d'autres locales -> préférer la détection Accept-Language du proxy.
  async redirects() {
    return [{ source: "/", destination: "/fr", permanent: false }];
  },
  // Fixe la racine du workspace : un package-lock.json existe plus haut dans
  // l'arborescence (profil utilisateur), ce qui faisait mal détecter la racine.
  turbopack: {
    root: __dirname,
    // Le moteur partagé docs/_engine importe node:fs/url/path dans des fonctions
    // Node-only jamais exécutées côté client — on les résout vers un module vide
    // pour les bundles navigateur (cf. next docs, "Resolve alias fallback").
    resolveAlias: {
      "node:fs": { browser: "./src/empty.ts" },
      "node:url": { browser: "./src/empty.ts" },
      "node:path": { browser: "./src/empty.ts" },
    },
  },
};

export default nextConfig;
