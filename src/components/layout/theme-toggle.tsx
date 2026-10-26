"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Light/dark toggle. Icons and label are swapped with the `dark:` CSS variant
 * rather than React state, so server HTML and client HTML always match.
 */
export function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const t = useTranslations("nav");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={t("toggleTheme")}
      data-testid="theme-toggle"
      className={cn("inline-flex items-center gap-2", className)}
    >
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
      {showLabel && (
        <span>
          <span className="dark:hidden">{t("themeDark")}</span>
          <span className="hidden dark:inline">{t("themeLight")}</span>
        </span>
      )}
    </button>
  );
}
