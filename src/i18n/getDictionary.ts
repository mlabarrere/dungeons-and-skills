// Chargement des dictionnaires côté serveur uniquement (patron Next 16 i18n).
// Les messages ne partent au client que via les props que les pages transmettent.
import "server-only";
import type { Locale } from "./config";
import type frMessages from "./messages/fr.json";

export type Messages = typeof frMessages;

const dictionaries: Record<Locale, () => Promise<Messages>> = {
  fr: () => import("./messages/fr.json").then((m) => m.default),
  // en: () => import("./messages/en.json").then((m) => m.default),
};

export const getDictionary = (locale: Locale): Promise<Messages> => dictionaries[locale]();
