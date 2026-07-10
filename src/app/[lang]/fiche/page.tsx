// Fiche officielle vierge imprimable (déjà bilingue via official/labels.ts).
// La locale vient du segment [lang] de l'app (FR au départ ; /en/fiche quand "en" activé).
import OfficialCharacterSheet from "@/components/sheet/official/OfficialCharacterSheet";
import { LABELS, type Locale as SheetLocale } from "@/components/sheet/official/labels";
import PrintButton from "./PrintButton";

const PRINT_LABEL: Record<SheetLocale, string> = { fr: "Imprimer / PDF", en: "Print / PDF" };

export default async function FichePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale: SheetLocale = lang === "en" ? "en" : "fr";
  return (
    <div style={{ minHeight: "100vh", background: "#f4f1ea" }}>
      <header
        className="no-print"
        style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12,
          padding: "12px 20px", borderBottom: "1px solid #ddd4c2", background: "#fbfaf6",
          position: "sticky", top: 0, zIndex: 10,
        }}
      >
        <PrintButton label={PRINT_LABEL[locale]} />
      </header>
      <main style={{ padding: 24, overflowX: "auto" }}>
        <OfficialCharacterSheet locale={locale} />
      </main>
      <span style={{ display: "none" }}>{LABELS[locale].wordmark}</span>
    </div>
  );
}
