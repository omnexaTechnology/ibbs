import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// Rendered inside the locale layout (header/footer, lang, dir, theme, fonts).
export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");
  return (
    <section className="mx-auto max-w-[1280px] px-8 py-24" data-testid="not-found">
      <p className="text-sm font-semibold tracking-[0.2em] text-link rtl:tracking-normal">{t("code")}</p>
      <h1 className="mt-3 text-5xl font-semibold">{t("title")}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{t("body")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-full bg-btn px-6 text-[15px] font-semibold text-btn-text"
      >
        {t("home")}
      </Link>
    </section>
  );
}
