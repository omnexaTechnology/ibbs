import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import type { Project } from "@/sanity/view-models";
import { ProjectFacts } from "./project-facts";

const image = { src: "https://cdn.sanity.io/images/p/d/a-100x100.jpg", width: 100, height: 100, lqip: null, objectPosition: "50% 50%", alt: { en: "", ar: "" } };

const project: Project = {
  id: "p1",
  slug: "exec-hq",
  title: { en: "Executive HQ", ar: "المقر التنفيذي" },
  category: "exec",
  cover: image,
  gallery: [image],
  areaM2: 1200,
  durationDays: 45,
  year: 2024,
  city: { en: "Riyadh", ar: "الرياض" },
  client: null,
  challenge: { en: "", ar: "" },
  solution: { en: "", ar: "" },
  hotspots: [],
  scope: [],
  order: null,
};

describe("ProjectFacts", () => {
  it("shows every fact in English", () => {
    renderWithIntl(<ProjectFacts project={{ ...project, client: { en: "Acme", ar: "أكمي" } }} />);
    expect(screen.getByTestId("fact-client")).toHaveTextContent("Acme");
    expect(screen.getByTestId("fact-sector")).toHaveTextContent("Offices");
    expect(screen.getByTestId("fact-area")).toHaveTextContent("1200 m²");
    expect(screen.getByTestId("fact-duration")).toHaveTextContent("45 days");
    expect(screen.getByTestId("fact-location")).toHaveTextContent("Riyadh");
    expect(screen.getByTestId("fact-year")).toHaveTextContent("2024");
  });

  it("BR-003: hides the client row when the client name is empty", () => {
    renderWithIntl(<ProjectFacts project={project} />);
    expect(screen.queryByTestId("fact-client")).toBeNull();
    expect(screen.getByTestId("fact-sector")).toBeInTheDocument();
  });

  it("hides rows with no value instead of showing placeholders", () => {
    renderWithIntl(<ProjectFacts project={{ ...project, areaM2: null, durationDays: null, year: null, city: { en: "", ar: "" } }} />);
    for (const k of ["area", "duration", "year", "location"]) expect(screen.queryByTestId(`fact-${k}`)).toBeNull();
  });

  it("renders Arabic copy and values", () => {
    renderWithIntl(<ProjectFacts project={project} />, "ar");
    expect(screen.getByTestId("fact-location")).toHaveTextContent("الرياض");
    expect(screen.getByTestId("fact-sector")).toHaveTextContent("المكاتب");
  });
});
