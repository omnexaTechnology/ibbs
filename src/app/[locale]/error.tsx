"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Error boundary for the pages inside the locale layout (Next 16: the prop is `retry`, which
 * re-fetches and re-renders the segment). Content reads throw when Sanity is configured but
 * unreachable (review F-02), so a visitor right after a publish can land here; the retry works
 * as soon as Sanity answers. Errors of the layout itself are caught by src/app/global-error.tsx.
 */
export default function LocaleError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("errorPage");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-[1280px] px-8 py-24" data-testid="error-page" role="alert">
      <h1 className="text-5xl font-semibold">{t("title")}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{t("body")}</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-11 items-center rounded-full bg-btn px-6 text-[15px] font-semibold text-btn-text"
        >
          {t("retry")}
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center px-2 text-[15px] font-semibold text-link">
          {t("home")}
        </Link>
      </div>
    </section>
  );
}
