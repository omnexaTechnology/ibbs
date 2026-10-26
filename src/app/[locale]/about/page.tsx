import type { Locale } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { LangSwitch } from "@/components/layout/lang-switch";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Placeholder />;
}

function Placeholder() {
  const t = useTranslations("about");
  return (
    <main className="p-8">
      <h1 data-testid="page-title">
        {t("aboutH1a")} {t("aboutH1b")}
      </h1>
      <ThemeToggle />
      <Suspense fallback={null}>
        <LangSwitch />
      </Suspense>
    </main>
  );
}
