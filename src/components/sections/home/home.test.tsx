import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import type { ReactElement } from "react";
import ar from "../../../../messages/ar.json";
import en from "../../../../messages/en.json";
import { stats } from "@/content/stats";
import { toHeroSlides } from "@/sanity/view-models";
import type { Locale } from "@/i18n/routing";

vi.mock("next-intl/server", () => ({
  getTranslations: async ({ locale, namespace }: { locale: Locale; namespace: string }) =>
    createTranslator({ locale, messages: locale === "ar" ? ar : en, namespace } as never),
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock("@/components/ui/sanity-image", () => ({ SanityPicture: () => null }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { AboutIntro } from "./about-intro";
import { Hero } from "./hero";
import { Partners } from "./partners";
import { Sectors } from "./sectors";
import { Stats } from "./stats";

const show = (ui: ReactElement, locale: Locale) =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en}>
      {ui}
    </NextIntlClientProvider>,
  );

describe("home hero (REQ-001)", () => {
  it("renders 4 slides with the design default images and hotspots when Sanity slots are empty (BR-006)", async () => {
    show(await Hero({ locale: "en", slides: toHeroSlides(null) }), "en");
    expect(screen.getAllByTestId("carousel-slide")).toHaveLength(4);
    expect(screen.getAllByTestId("hotspot-image")).toHaveLength(4);
    expect(screen.getAllByTestId("hotspot")).toHaveLength(9);
    expect(screen.getByRole("heading", { level: 1, name: /Spaces Designed Around Your Business/ })).toBeInTheDocument();
  });

  it("B1-03/BR-002: mirrors the image and the pins together in Arabic, neither in English", async () => {
    const x = (container: HTMLElement) => Number(container.querySelector('[data-testid="hotspot"]')?.getAttribute("data-x"));
    const a = show(await Hero({ locale: "en", slides: toHeroSlides(null) }), "en");
    expect(a.container.querySelectorAll('[data-testid="hotspot-mirror"]')).toHaveLength(0);
    expect(x(a.container)).toBe(74);
    a.unmount();
    const b = show(await Hero({ locale: "ar", slides: toHeroSlides(null) }), "ar");
    expect(b.container.querySelectorAll('[data-testid="hotspot-mirror"]')).toHaveLength(4);
    expect(x(b.container)).toBe(26);
  });
});

describe("home sections", () => {
  it("BR-003: placeholder stats are not rendered; confirmed ones are, with the unit", async () => {
    expect(stats.every((s) => !s.confirmed)).toBe(true);
    const { container, unmount } = show(await AboutIntro({ locale: "en" }), "en");
    expect(screen.queryByTestId("home-stats")).toBeNull();
    expect(container.textContent).not.toMatch(/placeholders/i);
    unmount();
    show((await Stats({ locale: "en", items: stats.map((s) => ({ ...s, confirmed: s.key !== "years" })) }))!, "en");
    const band = screen.getByTestId("home-stats");
    expect(within(band).getAllByTestId("counter")).toHaveLength(3);
    expect(band).toHaveTextContent("K m²");
    expect(band).not.toHaveTextContent("Years of expertise");
  });

  it("partners: the looped copy is hidden from assistive tech", async () => {
    show(await Partners({ locale: "en" }), "en");
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(document.querySelectorAll('[aria-hidden="true"][role="presentation"]')).toHaveLength(8);
  });

  it("sectors link to the filtered project list in both languages", async () => {
    show(await Sectors({ locale: "ar" }), "ar");
    const links = screen.getAllByTestId("sector-link");
    expect(links).toHaveLength(6);
    expect(links[0]).toHaveAttribute("href", "/projects?category=hq");
    expect(links[0]).toHaveTextContent("الشركات");
  });
});
