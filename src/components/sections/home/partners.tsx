import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { SHOW_PLACEHOLDER_LOGOS } from "@/content/placeholders";
import { cn } from "@/lib/utils";

/** Generic partner marks from the design (SVG paths, 32x32). Real logos replace them once approved (FEAT-005). */
const MARKS = [
  "M4 16a12 12 0 1 1 24 0h-6a6 6 0 1 0-12 0z",
  "M6 6h20v6H12v14H6z",
  "M16 3l13 13-13 13L3 16zm0 7l-6 6 6 6 6-6z",
  "M3 16 16 3v8h13L16 29v-8H3z",
  "M16 4l12 22H4zm0 9-5 9h10z",
  "M5 5h10v10H5zm12 12h10v10H17zM17 5h10v10H17z",
  "M16 3a13 13 0 1 0 0 26 13 13 0 0 0 0-26zm0 6a7 7 0 1 1 0 14V9z",
  "M4 26 14 6h4l10 20h-6l-6-12-6 12z",
];

/** Partners strip (REQ-002): a seamless loop of logo marks. The second copy is hidden from assistive tech. */
export async function Partners({ locale }: { locale: Locale }) {
  if (!SHOW_PLACEHOLDER_LOGOS) return null;
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <section aria-labelledby="partners-h" className="py-[clamp(36px,4.5vw,56px)] text-center" data-testid="home-partners">
      <h2 id="partners-h" className="text-[clamp(17px,1.5vw,20px)] font-medium">
        {t("ptStripT")}
      </h2>
      <div className="ui-mq mt-[clamp(20px,2.4vw,30px)] overflow-hidden [mask-image:linear-gradient(90deg,transparent,rgba(0,0,0,.35)_18%,#000_40%,#000_60%,rgba(0,0,0,.35)_82%,transparent)]">
        <div className="ui-mq-track ui-mq-flip" role="list" aria-label={t("ptStripT")}>
          {[0, 1].map((copy) =>
            MARKS.map((d, i) => (
              <div
                key={`${copy}-${i}`}
                role={copy === 0 ? "listitem" : "presentation"}
                aria-hidden={copy === 1 ? true : undefined}
                className={cn("me-[clamp(36px,4.5vw,72px)] inline-flex flex-none items-center gap-2.5 text-[clamp(17px,1.7vw,24px)] font-bold whitespace-nowrap", copy === 1 && "ui-mq-dup")}
              >
                <svg viewBox="0 0 32 32" className="size-[1.35em] flex-none fill-current" aria-hidden="true">
                  <path d={d} />
                </svg>
                <span>{t("partnerLogo")}</span>
              </div>
            )),
          )}
        </div>
      </div>
    </section>
  );
}
