import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/sections/legal/legal-page";
import { getLegalDoc } from "@/content/legal";
import { routing } from "@/i18n/routing";
import { getSiteSettings } from "@/lib/site-settings";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const brand = (await getTranslations({ locale, namespace: "common" }))("brand");
  const doc = getLegalDoc(locale, "privacy");
  return { title: `${doc.title} | ${brand}`, description: doc.lead };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <LegalPage doc={getLegalDoc(locale, "privacy")} settings={await getSiteSettings()} />;
}
