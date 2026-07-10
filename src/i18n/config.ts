// Configuration i18n — FR au départ, architecture prête pour d'autres langues.
export const locales = ["fr"] as const; // ajouter "en" ici + messages/en.json
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export function hasLocale(x: string): x is Locale {
  return (locales as readonly string[]).includes(x);
}
