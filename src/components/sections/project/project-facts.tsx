import type { ReactNode } from "react";
import { Building, BoundingBox, Calendar3, Clock, GeoAlt, Person } from "react-bootstrap-icons";
import { useLocale, useTranslations } from "next-intl";
import { projectCategories } from "@/content/taxonomy";
import { localize } from "@/lib/contact";
import type { Project } from "@/sanity/view-models";

type Row = { key: string; icon: ReactNode; label: string; value: string };

/** The sidebar "Project details" card. Rows without a value are not rendered (client name: BR-003). */
export function ProjectFacts({ project }: { project: Project }) {
  const locale = useLocale();
  const t = useTranslations("projectDetail");
  const tc = useTranslations("common");
  const sector = projectCategories.find((c) => c.key === project.category);
  const city = localize(project.city, locale);
  const client = project.client ? localize(project.client, locale) : "";

  const rows: (Row | null)[] = [
    client ? { key: "client", icon: <Person />, label: t("client"), value: client } : null,
    sector ? { key: "sector", icon: <Building />, label: t("sector"), value: localize(sector.label, locale) } : null,
    project.areaM2 !== null ? { key: "area", icon: <BoundingBox />, label: t("area"), value: `${project.areaM2} m²` } : null,
    project.durationDays !== null ? { key: "duration", icon: <Clock />, label: t("duration"), value: `${project.durationDays} ${tc("days")}` } : null,
    city ? { key: "location", icon: <GeoAlt />, label: t("location"), value: city } : null,
    project.year !== null ? { key: "year", icon: <Calendar3 />, label: t("year"), value: String(project.year) } : null,
  ];

  return (
    <section
      aria-labelledby="project-facts-h"
      className="rounded-[22px] border border-line bg-surface p-[30px] shadow-[0_20px_44px_-32px_rgba(var(--navy-rgb),0.5)]"
      data-testid="project-facts"
    >
      <h2 id="project-facts-h" className="mb-3 text-[22px] font-bold">
        {t("pdInfo")}
      </h2>
      <dl>
        {rows.map((r) =>
          r ? (
            <div key={r.key} className="grid grid-cols-[40px_1fr] items-center gap-x-3.5 border-b border-line py-3.5 last:border-b-0" data-testid={`fact-${r.key}`}>
              <dt className="contents">
                <span className="col-start-1 row-span-2 grid size-10 place-items-center rounded-xl bg-fg/5 text-blue dark:text-cyan [&>svg]:size-[18px]" aria-hidden="true">
                  {r.icon}
                </span>
                <span className="col-start-2 row-start-1 text-[12.5px] text-muted">{r.label}</span>
              </dt>
              <dd className="col-start-2 row-start-2 mt-0.5 text-base font-semibold">{r.value}</dd>
            </div>
          ) : null,
        )}
      </dl>
    </section>
  );
}
