import { useTranslations } from "next-intl";
import { PageHero } from "@/components/sections/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import type { LegalDoc } from "@/content/legal";
import { usableEntries } from "@/lib/contact";
import type { SiteSettings } from "@/types/site-settings";

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * A legal page (privacy, terms): hero, table of contents (anchor links), numbered sections and a contact bar.
 * The contact bar shows the first e-mail from the site settings and is hidden when none is set.
 */
export function LegalPage({ doc, settings }: { doc: LegalDoc; settings: SiteSettings }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const tf = useTranslations("footer");
  const email = usableEntries(settings.emails)[0]?.value;

  return (
    <>
      <PageHero crumbs={[{ label: t("navHome"), href: "/" }, { label: doc.title }]} eyebrow={tc("brand")} title={doc.title} lead={doc.lead} />
      <section className="mx-auto max-w-[1280px] px-8 pb-28 pt-10">
        <div className="grid items-start gap-16 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label={tc("contents")} className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-6 text-sm text-muted lg:sticky lg:top-28" data-testid="legal-toc">
            {doc.sections.map((s, i) => (
              <a key={i} href={`#legal-${i + 1}`} className="text-muted no-underline hover:text-link">
                <span className="me-2 font-semibold text-link tabular-nums">{num(i)}</span>
                {s.heading}
              </a>
            ))}
          </nav>
          <div className="flex max-w-[820px] flex-col gap-[18px]">
            {doc.sections.map((s, i) => (
              <Reveal as="article" key={i} className="flex gap-[22px] rounded-[20px] border border-line bg-surface px-[30px] py-7 max-sm:flex-col max-sm:gap-3 max-sm:px-5">
                <span className="w-12 flex-none text-[30px] leading-none font-bold tracking-[-0.03em] text-link tabular-nums" aria-hidden="true">
                  {num(i)}
                </span>
                <div id={`legal-${i + 1}`} className="scroll-mt-28">
                  <h2 className="text-[21px] font-semibold">{s.heading}</h2>
                  {s.body.map((p, k) => (
                    <p key={k} className="mt-2 text-base leading-[1.85] text-muted">
                      {p}
                    </p>
                  ))}
                </div>
              </Reveal>
            ))}
            {email ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-navy px-[30px] py-[26px] text-cream" data-testid="legal-contact">
                <b className="text-lg">{tf("lgQ")}</b>
                <ButtonLink href={`mailto:${email}`} external className="bg-cream text-navy hover:text-white">
                  {email}
                </ButtonLink>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
