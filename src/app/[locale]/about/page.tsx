import { getTranslations, setRequestLocale } from "next-intl/server";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import type { Locale } from "@/i18n/routing";

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  return <PagePlaceholder title={`${t("aboutH1a")} ${t("aboutH1b")}`} />;
}
