import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { fontClassFor } from "@/lib/fonts";
import { getSiteSettings } from "@/lib/site-settings";
import { getDirection, routing } from "@/i18n/routing";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: t("brand") };
}

// This layout is the root layout: <html lang dir> depends on the locale.
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Callers do not know where settings come from (defaults now, Sanity in FEAT-002).
  const settings = await getSiteSettings();

  return (
    <html lang={locale} dir={getDirection(locale)} className={fontClassFor(locale)} suppressHydrationWarning>
      <body className="site">
        <ThemeProvider>
          <NextIntlClientProvider>
            <Header settings={settings} />
            <main id="main">{children}</main>
            <Footer settings={settings} />
            <WhatsAppButton settings={settings} />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
