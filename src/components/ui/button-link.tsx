import type { ReactNode } from "react";
import { ArrowRight } from "react-bootstrap-icons";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  variant?: "primary" | "ghost";
  /** Plain anchor instead of an app route: http(s) URLs open in a new tab, mailto:/tel: stay in place. */
  external?: boolean;
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
};

const base =
  "group inline-flex min-h-[52px] items-center justify-center gap-3.5 rounded-full border ps-6 pe-1.5 text-[15px] font-semibold no-underline transition-colors duration-300";
const variants = {
  primary: "border-transparent bg-btn text-btn-text hover:bg-blue hover:text-white dark:hover:bg-navy",
  ghost: "border-line bg-transparent text-fg hover:border-blue hover:text-link",
} as const;

/** The design's pill button with an arrow disc. Internal links use the transition-aware Link. */
export function ButtonLink({ href, variant = "primary", external, children, className, ...rest }: Props) {
  const classes = cn(base, variants[variant], className);
  const arrow = (
    <span
      className={cn(
        "grid size-10 flex-none place-items-center rounded-full transition-transform duration-500 group-hover:-rotate-45 rtl:group-hover:rotate-45",
        variant === "primary" ? "bg-btn-text text-btn" : "bg-fg/10 text-fg",
      )}
      aria-hidden="true"
    >
      <ArrowRight className="size-4 rtl:-scale-x-100" />
    </span>
  );
  if (external) {
    return (
      <a href={href} {...(/^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={classes} data-testid={rest["data-testid"]}>
        {children}
        {arrow}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} data-testid={rest["data-testid"]}>
      {children}
      {arrow}
    </Link>
  );
}
