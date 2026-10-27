import { getTranslations, setRequestLocale } from "next-intl/server";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import type { Locale } from "@/i18n/routing";

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  return <PagePlaceholder title={`${t("ctH1a")} ${t("ctH1b")}`} />;
}
