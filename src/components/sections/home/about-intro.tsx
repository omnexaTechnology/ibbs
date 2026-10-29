import type { Locale } from "@/i18n/routing";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { Stats } from "./stats";

const pic = "relative overflow-hidden shadow-[0_30px_60px_-30px_rgba(var(--night-rgb),.45)]";
/** One frame for all four photos: the rounded rectangle of the top-right one. */
const frame = "aspect-[.8] w-full rounded-[28px] max-[1100px]:w-[46%]";
const col = "flex flex-col gap-[26px] max-[1100px]:flex-row max-[1100px]:items-center max-[1100px]:justify-center";

/** About intro (REQ-002): headline, lead, two buttons and four photos around them, then the stats band. */
export async function AboutIntro({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const shapes = [
    { src: "/images/home/about1.jpg", alt: t("abAlt1"), cls: frame },
    { src: "/images/home/about2.jpg", alt: t("abAlt2"), cls: frame },
    { src: "/images/home/about3.jpg", alt: t("abAlt3"), cls: frame },
    { src: "/images/home/about4.jpg", alt: t("abAlt4"), cls: frame },
  ];
  const column = (list: typeof shapes, extra = "") => (
    <div className={`${col} ${extra}`}>
      {list.map((s, i) => (
        <Reveal key={s.src} variant="image" className={`${pic} ${s.cls} ${i === 1 ? "max-sm:hidden" : "max-sm:!w-4/5"}`}>
          <Image src={s.src} alt={s.alt} fill sizes="(min-width: 1101px) 22vw, 40vw" className="object-cover" />
        </Reveal>
      ))}
    </div>
  );
  return (
    <section className="py-[130px] max-sm:py-20" data-testid="home-about">
      <div className="mx-auto grid max-w-[1400px] items-center gap-11 px-8 max-sm:px-4 min-[1101px]:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)_minmax(0,1fr)]">
        {column(shapes.slice(0, 2))}
        <div className="relative z-[2] flex flex-col items-center text-center">
          <Reveal className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface px-[18px] py-[9px] text-xs font-medium tracking-[0.18em] uppercase rtl:text-sm rtl:tracking-normal">
            <span className="size-2 rounded-full bg-blue" aria-hidden="true" />
            {t("ab1Badge")}
          </Reveal>
          <Reveal>
            <h2 className="mt-[30px] text-[clamp(40px,5.6vw,84px)] leading-[1.04] font-bold tracking-[-0.04em] max-sm:text-[clamp(34px,10vw,44px)] rtl:leading-[1.3] rtl:tracking-normal">
              {t("ab1T1")} <span className="text-blue dark:text-cyan">{t("ab1Hl")}</span>
            </h2>
          </Reveal>
          <Reveal>
            <p className="mx-auto mt-[26px] max-w-[700px] text-[19px] text-muted">{t("aboutBody")}</p>
          </Reveal>
          <Reveal className="mt-10 flex flex-wrap justify-center gap-3.5">
            <ButtonLink href="/projects">{t("ctaExplore")}</ButtonLink>
            <ButtonLink href="/about" variant="ghost">
              {t("ourStory")}
            </ButtonLink>
          </Reveal>
        </div>
        {column(shapes.slice(2), "min-[1101px]:items-end max-[1100px]:order-3")}
      </div>
      <Stats locale={locale} />
    </section>
  );
}
