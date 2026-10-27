import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

describe("design tokens (REQ-004)", () => {
  it.each([
    ["--navy", "#1e2e5a"],
    ["--blue", "#2e6eb5"],
    ["--cyan", "#4ca6cb"],
    ["--green", "#8bc34a"],
    ["--gray", "#e6e6e6"],
    ["--cream", "#f5f2ec"],
    ["--night", "#0b1120"],
    ["--night-2", "#131d36"],
    ["--navy-rgb", "30, 46, 90"],
    ["--night-2-rgb", "19, 29, 54"],
  ])("%s = %s", (name, value) => {
    expect(css.toLowerCase()).toContain(`${name}: ${value}`);
  });

  it("defines light and dark surface variables", () => {
    expect(css).toMatch(/:root\s*{[^}]*--bg: var\(--cream\)/);
    expect(css).toMatch(/\.dark\s*{[^}]*--bg: var\(--night\)/);
  });

  it("maps tokens into the Tailwind theme", () => {
    expect(css).toContain("--color-navy: var(--navy)");
    expect(css).toContain("--color-surface: var(--surface)");
  });
});
