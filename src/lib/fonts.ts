import { Alexandria, Montserrat } from "next/font/google";

// Self-hosted by next/font at build time (OFL licensed).
export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-montserrat",
});

export const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-alexandria",
});

/** Font class for a locale: Alexandria for Arabic, Montserrat otherwise. */
export function fontClassFor(locale: string) {
  return locale === "ar" ? alexandria.variable : montserrat.variable;
}
