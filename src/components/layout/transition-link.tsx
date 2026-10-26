"use client";

import type { ComponentProps } from "react";
import { Link as BaseLink } from "@/i18n/navigation-base";
import { type Href, usePageTransition } from "./page-transition";

type Props = ComponentProps<typeof BaseLink> & {
  /** Text on the page-transition curtains (default: the name of the target page). */
  transitionLabel?: string;
};

function isModifiedClick(e: React.MouseEvent) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

/**
 * Locale-aware link that plays the page transition on plain internal clicks.
 * Falls back to normal Next.js navigation for modified clicks (new tab...),
 * `target`/`download` links, hash-only links, links that switch locale, and
 * when no PageTransitionProvider is mounted.
 */
export function Link({ transitionLabel, onClick, ...props }: Props) {
  const transition = usePageTransition();

  return (
    <BaseLink
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || !transition) return;
        if (isModifiedClick(e) || props.locale || props.target || props.download) return;
        const { href } = props;
        if (typeof href === "string" && (href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href))) return;

        if (transition.navigate(href as Href, { label: transitionLabel })) e.preventDefault();
      }}
    />
  );
}
