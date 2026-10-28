import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import type { Project } from "@/sanity/view-models";

const scrollIntoView = vi.fn(); // jsdom has none
Element.prototype.scrollIntoView = scrollIntoView;
let search = "";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search) }));
vi.mock("@/components/ui/sanity-image", () => ({ SanityPicture: () => null }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { filterProjects, pageSequence, ProjectsExplorer, PAGE_SIZE } from "./projects-explorer";
import { ProjectsExplorerFromUrl } from "./projects-explorer-from-url";

const img = { src: "https://cdn.sanity.io/x.jpg", width: 10, height: 10, lqip: null, objectPosition: "50% 50%", alt: { en: "", ar: "" } };
const make = (i: number, o: Partial<Project> = {}): Project => ({
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
  ...o,
});
const all = [
  ...Array.from({ length: 10 }, (_, i) => make(i + 1)),
  make(11, { category: "mosque", city: { en: "Jeddah", ar: "جدة" }, title: { en: "Grand Mosque", ar: "الجامع الكبير" }, scope: ["chairs"] }),
];

describe("projects filtering", () => {
  it("filters by category, scope type, city and a search in either language", () => {
    const f = { category: "all", type: "all", city: "all", q: "" } as const;
    expect(filterProjects(all, f)).toHaveLength(11);
    expect(filterProjects(all, { ...f, category: "mosque" })).toHaveLength(1);
    expect(filterProjects(all, { ...f, type: "chairs" })).toHaveLength(1);
    expect(filterProjects(all, { ...f, city: "Jeddah" })).toHaveLength(1);
    expect(filterProjects(all, { ...f, q: " جدة " })).toHaveLength(1);
    expect(filterProjects(all, { ...f, q: "mosques" })).toHaveLength(1); // sector label
    expect(filterProjects(all, { ...f, q: "nothing" })).toHaveLength(0);
  });

  it("page buttons keep first, last and neighbours with gaps", () => {
    expect(pageSequence(1, 0)).toEqual([0]);
    expect(pageSequence(9, 4)).toEqual([0, -1, 3, 4, 5, -1, 8]);
  });
});

describe("<ProjectsExplorer>", () => {
  it("shows 2 rows (8) per page, tab counts, and pages through the list", () => {
    search = "";
    renderWithIntl(<ProjectsExplorer projects={all} locale="en" />);
    expect(screen.getAllByTestId("project-card")).toHaveLength(PAGE_SIZE);
    expect(screen.getByTestId("tab-all")).toHaveTextContent("11");
    expect(screen.getByTestId("tab-mosque")).toHaveTextContent("1");
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getAllByTestId("project-card")).toHaveLength(3);
    expect(scrollIntoView).toHaveBeenCalled(); // R3-08
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("search and city narrow the list, reset to page 1 and show the empty message", () => {
    search = "";
    renderWithIntl(<ProjectsExplorer projects={all} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    fireEvent.change(screen.getByTestId("filter-search"), { target: { value: "grand" } });
    expect(screen.getAllByTestId("project-card")).toHaveLength(1);
    fireEvent.change(screen.getByTestId("filter-search"), { target: { value: "" } });
    fireEvent.change(screen.getByTestId("filter-city"), { target: { value: "Jeddah" } });
    expect(screen.getAllByTestId("project-card")).toHaveLength(1);
    fireEvent.change(screen.getByTestId("filter-search"), { target: { value: "zzz" } });
    expect(screen.getByTestId("projects-empty")).toBeInTheDocument();
  });

  it("?category= pre-selects the tab; unknown values are ignored", () => {
    search = "category=mosque";
    const a = renderWithIntl(<ProjectsExplorerFromUrl projects={all} locale="en" />);
    expect(screen.getByTestId("tab-mosque")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByTestId("project-card")).toHaveLength(1);
    a.unmount();
    search = "category=<script>";
    renderWithIntl(<ProjectsExplorerFromUrl projects={all} locale="en" />);
    expect(screen.getByTestId("tab-all")).toHaveAttribute("aria-pressed", "true");
  });

  it("Arabic: localized titles and tab labels", () => {
    search = "";
    renderWithIntl(<ProjectsExplorer projects={all} locale="ar" />, "ar");
    expect(screen.getByTestId("tab-mosque")).toHaveTextContent("المساجد");
    expect(screen.getAllByTestId("project-card")[0]).toHaveTextContent("مشروع 1");
  });
});

describe("R3-02: the category follows the prop after mount", () => {
  it("re-selecting a tab through the prop switches the list and resets the page", () => {
    search = "";
    const { rerender } = renderWithIntl(<ProjectsExplorer projects={all} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    rerender(<ProjectsExplorer projects={all} locale="en" category="mosque" />);
    expect(screen.getByTestId("tab-mosque")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByTestId("project-card")).toHaveLength(1);
  });
});
