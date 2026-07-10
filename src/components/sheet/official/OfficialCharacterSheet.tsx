// Fiche officielle D&D 2024 en HTML/CSS/SVG — réplique fidèle, remplissable.
// Composant serveur, sans état : un simple formulaire vierge localisé.
// Usage : <OfficialCharacterSheet locale="fr" /> ou "en".

import { Cinzel } from "next/font/google";
import s from "./sheet.module.css";
import { LABELS, type Locale } from "./labels";
import SheetPage1 from "./SheetPage1";
import SheetPage2 from "./SheetPage2";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-cinzel",
  display: "swap",
});

export default function OfficialCharacterSheet({
  locale = "fr",
}: {
  locale?: Locale;
}) {
  const t = LABELS[locale];
  return (
    <div className={`${cinzel.variable} ${s.sheet}`} lang={locale}>
      <SheetPage1 t={t} />
      <SheetPage2 t={t} />
    </div>
  );
}
