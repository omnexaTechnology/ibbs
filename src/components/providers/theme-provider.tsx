"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Class-based theme (adds `dark` to <html>). next-themes injects a blocking
 * inline script, so the stored theme is applied before first paint (no flash).
 * The design defaults to light, so system preference is not used.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
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
