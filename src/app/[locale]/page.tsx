import type { Locale } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { LangSwitch } from "@/components/layout/lang-switch";
import { Link } from "@/i18n/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Placeholder />;
}

function Placeholder() {
  const t = useTranslations("home");
  const n = useTranslations("nav");
  return (
    <main className="p-8">
      <h1 data-testid="hero-title">{t("heroL1")}</h1>
      <Link href="/about">{n("navAbout")}</Link>
      <Suspense fallback={null}>
        <LangSwitch />
      </Suspense>
    </main>
  );
}
