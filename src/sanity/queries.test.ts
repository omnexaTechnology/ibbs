import { describe, expect, it } from "vitest";
import { HOME_PROJECT_LIMIT } from "@/content/taxonomy";
import { HOME_QUERY, PROJECTS_QUERY } from "./queries";

describe("F-03: home page shows all projects in design order", () => {
  it("HOME_QUERY has no featured filter and caps at HOME_PROJECT_LIMIT (6 = the accordion's clip shapes)", () => {
    expect(HOME_PROJECT_LIMIT).toBe(6);
    expect(HOME_QUERY).not.toContain("featured");
    expect(HOME_QUERY).toContain(`[0...${HOME_PROJECT_LIMIT}]`);
    expect(HOME_QUERY).toContain("order(order asc, year desc, _createdAt desc)");
  });

  it("no query filters on or selects the retired featured flag", () => {
    expect(PROJECTS_QUERY).not.toContain("featured");
  });
});
