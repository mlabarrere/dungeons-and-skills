import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { getCatalog, buildClientCatalog } from "@/lib/catalog.server";
import { BuilderApp } from "./BuilderApp";

export default async function BuilderPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const catalog = buildClientCatalog(getCatalog());
  return <BuilderApp catalog={catalog} t={t} locale={lang} />;
}
