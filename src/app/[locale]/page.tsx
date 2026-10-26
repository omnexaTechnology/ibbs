import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Placeholder />;
}

function Placeholder() {
  const t = useTranslations("home");
  return (
    <section className="mx-auto max-w-[1280px] px-8 py-24">
      <h1 data-testid="page-title" className="text-5xl font-semibold">
        {t("heroL1")} {t("heroL2")}
      </h1>
    </section>
  );
}
