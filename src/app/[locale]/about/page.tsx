import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Placeholder />;
}

function Placeholder() {
  const t = useTranslations("about");
  return (
    <section className="mx-auto max-w-[1280px] px-8 py-24">
      <h1 data-testid="page-title" className="text-5xl font-semibold">
        {t("aboutH1a")} {t("aboutH1b")}
      </h1>
    </section>
  );
}
