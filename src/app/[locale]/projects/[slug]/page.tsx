import { getTranslations, setRequestLocale } from "next-intl/server";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default async function ProjectPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projectDetail");
  // The project itself (title, gallery, scope...) comes from Sanity in FEAT-002/003.
  return (
    <PagePlaceholder title={slug}>
      <Link href="/projects">{t("backProjects")}</Link>
    </PagePlaceholder>
  );
}
