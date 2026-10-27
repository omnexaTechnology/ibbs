import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { HotspotImage } from "@/components/ui/hotspot";
import { SanityPicture } from "@/components/ui/sanity-image";
import { Reveal } from "@/components/ui/reveal";
import { Stripes } from "@/components/ui/section-heading";
import { scopeItems } from "@/content/taxonomy";
import { localize } from "@/lib/contact";
import { getDirection } from "@/i18n/routing";
import type { Project } from "@/sanity/view-models";
import { CheckCircle } from "react-bootstrap-icons";

/** "About this project": the cover with its hotspots, then the challenge and the solution. */
export async function ProjectOverview({ project, locale }: { project: Project; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "projectDetail" });
  const dir = getDirection(locale);
  const title = localize(project.title, locale);
  const challenge = localize(project.challenge, locale);
  const solution = localize(project.solution, locale);
  const { cover } = project;

  return (
    <Reveal className="min-w-0">
      <span className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-link rtl:text-sm rtl:tracking-normal">
        <Stripes />
        {t("pdOverview")}
      </span>
      <h2 className="mt-3 text-[clamp(28px,2.8vw,42px)] leading-[1.15] font-bold tracking-[-0.03em] rtl:tracking-normal">{t("pdAbout")}</h2>

      {project.hotspots.length > 0 && cover.width > 0 && cover.height > 0 ? (
        <HotspotImage
          aspect={cover.width / cover.height}
          dir={dir}
          className="mt-6 rounded-xl shadow-site"
          hotspots={project.hotspots.map((h) => ({
            x: h.x,
            y: h.y,
            tag: localize(h.tag, locale) || undefined,
            title: localize(h.title, locale),
            desc: localize(h.description, locale) || undefined,
          }))}
        >
          <SanityPicture image={cover} alt={localize(cover.alt, locale) || title} sizes="(min-width: 1280px) 780px, (min-width: 1024px) 60vw, 100vw" />
        </HotspotImage>
      ) : null}

      {challenge ? (
        <>
          <h3 className="mt-6 text-[19px] font-semibold">{t("challengeT")}</h3>
          <p className="mt-2.5 text-[16.5px] leading-[1.85] text-muted">{challenge}</p>
        </>
      ) : null}
      {solution ? (
        <>
          <h3 className="mt-6 text-[19px] font-semibold">{t("solutionT")}</h3>
          <p className="mt-2.5 text-[16.5px] leading-[1.85] text-muted">{solution}</p>
        </>
      ) : null}
    </Reveal>
  );
}

/** "Scope of work": the furnishing items of this project, from the taxonomy. Hidden when the project has none. */
export async function ProjectScope({ project, locale }: { project: Project; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "projectDetail" });
  const items = project.scope.flatMap((key) => scopeItems.find((s) => s.key === key) ?? []);
  if (items.length === 0) return null;
  return (
    <Reveal className="min-w-0">
      <h2 className="text-[clamp(28px,2.8vw,42px)] leading-[1.15] font-bold tracking-[-0.03em] rtl:tracking-normal">{t("scopeTitle")}</h2>
      <ul className="mt-5 grid grid-cols-2 gap-3.5 max-sm:grid-cols-1" data-testid="project-scope">
        {items.map((s) => (
          <li key={s.key} className="flex items-start gap-3.5 rounded-2xl border border-line bg-surface p-[18px]">
            <CheckCircle className="mt-0.5 size-[22px] flex-none text-blue dark:text-cyan" aria-hidden="true" />
            <div>
              <b className="block text-[15.5px]">{localize(s.label, locale)}</b>
              <span className="mt-1 block text-sm leading-[1.6] text-muted">{localize(s.description, locale)}</span>
            </div>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
