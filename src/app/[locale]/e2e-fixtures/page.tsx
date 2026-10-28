import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Fixtures } from "./fixtures";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

/**
 * Test-only page for the e2e suite (UI primitives + a 3D scene). It exists only when the server was built with
 * E2E_FIXTURES=1 (playwright.config.ts sets it); a normal build answers 404.
 */
export default async function Page({ params }: Props) {
  if (process.env.E2E_FIXTURES !== "1") notFound();
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <Fixtures dir={locale === "ar" ? "rtl" : "ltr"} />;
}
