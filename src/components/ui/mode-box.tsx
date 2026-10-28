"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/** The design's "Mode" tab on the hero edge: two buttons that set the light or dark theme (same store as the header toggle). */
export function ModeBox({ className }: { className?: string }) {
  const tn = useTranslations("nav");
  const { resolvedTheme, setTheme } = useTheme();
  // The stored theme is only known on the client; render "not pressed" until mounted so server and client HTML match.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  const light = mounted && !dark;
  const sw = "relative grid size-11 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.12)] transition-transform hover:scale-[1.08] max-[900px]:size-9";
  const ring = "after:absolute after:-inset-1.5 after:rounded-full after:border-2 after:border-blue after:content-['']";
  return (
    <div role="group" aria-label={tn("modeLabel")} data-testid="mode-box" className={cn("absolute start-0 top-1/2 z-[8] flex -translate-y-1/2 flex-col items-center gap-3 rounded-e-[40px] bg-white px-2.5 py-[18px] shadow-[0_20px_40px_-20px_rgba(var(--night-rgb),.55)] dark:bg-night-2", className)}>
      <span className="max-w-14 text-center text-[10.5px] leading-tight font-bold tracking-[.1em] text-navy uppercase rtl:text-xs rtl:tracking-normal dark:text-cream">{tn("modeLabel")}</span>
      <button type="button" onClick={() => setTheme("light")} aria-label={tn("themeLight")} aria-pressed={light} className={cn(sw, "bg-cream text-navy", light && ring)}>
        <Sun className="size-[18px]" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => setTheme("dark")} aria-label={tn("themeDark")} aria-pressed={dark} className={cn(sw, "bg-night text-cream", dark && ring)}>
        <Moon className="size-[18px]" aria-hidden="true" />
      </button>
    </div>
  );
}
