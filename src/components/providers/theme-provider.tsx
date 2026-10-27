"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";

/**
 * Class-based theme (adds `dark` to <html>). next-themes injects a blocking
 * inline script, so the stored theme is applied before first paint (no flash).
 * The design defaults to light, so system preference is not used.
 *
 * Colour transitions (design: 0.5s) are only enabled once the page has loaded
 * (`html.theme-ready`); otherwise the initial light -> stored-dark change would
 * animate and look like a flash.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => document.documentElement.classList.add("theme-ready"));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="ibss-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
