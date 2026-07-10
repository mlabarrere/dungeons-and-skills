import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n/config";

// Redirige tout chemin sans préfixe de locale vers /{locale}. FR par défaut ;
// la détection Accept-Language est prête pour d'autres langues (ajouter dans config.ts).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // racine explicite + tout chemin hors _next et fichiers avec extension (assets)
  matcher: ["/", "/((?!_next|.*\\..*).*)"],
};
