import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Heading level of the title (default 2). */
  level?: 1 | 2 | 3;
  /** Right-hand slot (e.g. a "view all" link). */
  action?: ReactNode;
  /** Light text for dark sections. */
  inverted?: boolean;
  className?: string;
};

/** Brand stripes: three skewed bars in blue, cyan and green. */
export function Stripes() {
  return (
    <span className="ui-stripes" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

/** Eyebrow + title + lead, the design's section head (`.sec-head`, `.eyebrow`, `.h2`, `.lead`). */
export function SectionHeading({ eyebrow, title, lead, level = 2, action, inverted, className }: Props) {
  const Heading = `h${level}` as "h1" | "h2" | "h3";
  return (
    <div className={cn("ui-sec-head mb-14 flex flex-wrap items-end justify-between gap-6", className)}>
      <div>
        {eyebrow ? (
          <Reveal className={cn("ui-eyebrow inline-flex items-center gap-3 text-[12.5px] font-semibold uppercase tracking-[0.2em] rtl:text-sm rtl:tracking-normal", inverted ? "text-cyan" : "text-link")}>
            <Stripes />
            {eyebrow}
          </Reveal>
        ) : null}
        <Reveal>
          <Heading className={cn("text-[clamp(32px,4vw,54px)] leading-[1.08] font-semibold rtl:leading-[1.3]", eyebrow && "mt-5", inverted ? "text-cream" : "text-fg")}>
            {title}
          </Heading>
        </Reveal>
        {lead ? (
          <Reveal>
            <p className={cn("mt-5 max-w-[620px] text-lg", inverted ? "text-cream/72" : "text-muted")}>{lead}</p>
          </Reveal>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
