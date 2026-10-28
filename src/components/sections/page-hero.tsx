import type { ReactNode } from "react";
import { ChevronRight } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import { ModeBox } from "@/components/ui/mode-box";
import { Stripes } from "@/components/ui/section-heading";
import { Link } from "@/i18n/navigation";

export type Crumb = { label: string; href?: string };

type Props = {
  crumbs: Crumb[];
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Buttons under the lead. */
  actions?: ReactNode;
  /** Taller hero (contact page) instead of the compact one. */
  tall?: boolean;
};

/**
 * The design's inner-page hero (`.sk-hero`): breadcrumb, eyebrow, H1, lead and actions over the isometric
 * line drawing with the brand bands. Server component. The H1 carries `data-testid="page-title"`.
 */
export function PageHero({ crumbs, eyebrow, title, lead, actions, tall }: Props) {
  const t = useTranslations("ui");
  return (
    <section className={`relative flex items-center justify-center overflow-hidden px-8 py-20 text-center ${tall ? "min-h-[70vh]" : "min-h-[52vh]"}`}>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative line drawing, already an optimised SVG */}
        <img src="/images/hero-iso.svg" alt="" className="absolute inset-0 size-full object-cover object-[50%_60%] opacity-50 dark:opacity-15 dark:invert" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_48%,var(--bg)_0%,color-mix(in_srgb,var(--bg)_70%,transparent)_55%,transparent_100%),linear-gradient(0deg,var(--bg),transparent_18%)]" />
      </div>
      <div className="pointer-events-none absolute bottom-0 end-0 z-[1] hidden h-[60%] w-[min(26vw,360px)] overflow-hidden sm:block" aria-hidden="true">
        <i className="absolute bottom-[-10%] end-[46%] h-[130%] w-[22px] -skew-x-[26deg] bg-blue rtl:skew-x-[26deg]" />
        <i className="absolute bottom-[-10%] end-[36%] h-[130%] w-[14px] -skew-x-[26deg] bg-cyan rtl:skew-x-[26deg]" />
        <i className="absolute bottom-[-10%] end-[28%] h-[130%] w-[10px] -skew-x-[26deg] bg-green rtl:skew-x-[26deg]" />
      </div>

      <ModeBox className="hidden min-[1340px]:flex" />
      <div className="relative z-[2] mx-auto w-full max-w-[900px]">
        <nav aria-label={t("breadcrumb")} className="mb-5">
          <ol className="flex flex-wrap items-center justify-center gap-2.5 text-sm text-muted">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex items-center gap-2.5">
                {c.href ? (
                  <Link href={c.href} className="py-2.5 text-link no-underline hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
                {i < crumbs.length - 1 ? <ChevronRight className="size-3 rtl:rotate-180" aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
        </nav>
        {eyebrow ? (
          <div className="inline-flex items-center gap-3 text-[12.5px] font-semibold uppercase tracking-[0.2em] text-link rtl:text-sm rtl:tracking-normal">
            <Stripes />
            {eyebrow}
          </div>
        ) : null}
        <h1
          data-testid="page-title"
          className="mt-[18px] text-[clamp(40px,6vw,88px)] leading-[1.04] font-bold tracking-[-0.035em] text-fg rtl:leading-[1.3] rtl:tracking-normal"
        >
          {title}
        </h1>
        {lead ? <p className="mx-auto mt-6 max-w-[640px] text-lg text-muted">{lead}</p> : null}
        {actions ? <div className="mt-9 flex flex-wrap justify-center gap-3.5">{actions}</div> : null}
      </div>
    </section>
  );
}
