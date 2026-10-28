import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { createTranslator } from "next-intl";
import ar from "../../../../messages/ar.json";
import en from "../../../../messages/en.json";
import { renderWithIntl } from "@/test/render";
import type { Project } from "@/sanity/view-models";
import type { Locale } from "@/i18n/routing";

import { mockIntersectionObserver } from "@/test/dom-mocks";

mockIntersectionObserver();
Element.prototype.scrollBy = vi.fn(); // jsdom has none
vi.mock("next-intl/server", () => ({
  getTranslations: async ({ locale, namespace }: { locale: Locale; namespace: string }) =>
    createTranslator({ locale, messages: locale === "ar" ? ar : en, namespace } as never),
}));
vi.mock("@/components/ui/sanity-image", () => ({ SanityPicture: () => null }));
vi.mock("@/three/scene-root", () => ({ SceneRoot: () => <div data-testid="scene-stub" /> }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { Cta } from "./cta";
import { Faq } from "./faq";
import { Featured } from "./featured";

const img = { src: "https://cdn.sanity.io/x.jpg", width: 10, height: 10, lqip: null, objectPosition: "50% 50%", alt: { en: "", ar: "" } };
const make = (i: number): Project => ({
  id: `p${i}`,
  slug: `p-${i}`,
  title: { en: `Project ${i}`, ar: `مشروع ${i}` },
  category: "exec",
  cover: img,
  gallery: [img],
  areaM2: 100,
  durationDays: 30,
  year: 2024,
  city: { en: "Riyadh", ar: "الرياض" },
  client: null,
  challenge: { en: "", ar: "" },
  solution: { en: "", ar: "" },
  hotspots: [],
  scope: ["exec"],
  order: i,
});
const projects = Array.from({ length: 8 }, (_, i) => make(i + 1));

describe("home featured projects", () => {
  it("shows at most 6 panels, opens the first, and opens another on focus", () => {
    renderWithIntl(<Featured projects={projects} locale="en" />, "en");
    const panels = screen.getAllByTestId("featured-panel");
    expect(panels).toHaveLength(6);
    expect(panels[0]).toHaveAttribute("data-active", "true");
    fireEvent.focus(within(panels[2]).getByRole("button", { name: "Project 3" }));
    expect(panels[2]).toHaveAttribute("data-active", "true");
    expect(panels[0]).toHaveAttribute("data-active", "false");
    expect(within(panels[2]).getByTestId("featured-link")).toHaveAttribute("href", "/projects/p-3");
  });

  it("dots and arrows move the active panel; Arabic uses the Arabic title", () => {
    renderWithIntl(<Featured projects={projects} locale="ar" />, "ar");
    const panels = screen.getAllByTestId("featured-panel");
    fireEvent.click(screen.getByRole("button", { name: "4 / 6" }));
    expect(panels[3]).toHaveAttribute("data-active", "true");
    fireEvent.click(screen.getByRole("button", { name: ar.ui.next }));
    expect(panels[4]).toHaveAttribute("data-active", "true");
    expect(within(panels[4]).getByRole("heading", { level: 3 })).toHaveTextContent("مشروع 5");
  });

  it("renders nothing without projects (empty Sanity)", () => {
    const { container } = renderWithIntl(<Featured projects={[]} locale="en" />, "en");
    expect(container).toBeEmptyDOMElement();
  });
});

describe("home FAQ", () => {
  it("is a single-open accordion with correct ARIA and keyboard", async () => {
    renderWithIntl(await Faq({ locale: "en" }), "en");
    const qs = screen.getAllByRole("button", { expanded: false }).concat(screen.getAllByRole("button", { expanded: true }));
    expect(qs.length).toBeGreaterThanOrEqual(8);
    const first = screen.getAllByRole("button", { expanded: true });
    expect(first).toHaveLength(1);
    expect(first[0]).toHaveAttribute("aria-controls");
    const second = screen.getAllByRole("button", { expanded: false })[0];
    fireEvent.click(second);
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(1);
    expect(screen.getByRole("region", { name: second.textContent ?? "" })).toBeInTheDocument();
  });
});

describe("home CTA", () => {
  it("links to contact and projects, with the 3D scene inside", () => {
    renderWithIntl(<Cta />, "en");
    expect(screen.getByRole("link", { name: en.home.ctaBook })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: en.home.ctaSee })).toHaveAttribute("href", "/projects");
    expect(screen.getByTestId("scene-stub")).toBeInTheDocument();
  });
});
