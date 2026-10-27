import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom has no matchMedia: default to "no reduced motion, coarse pointer".
// Tests override window.matchMedia when they need other values.
// (Server-side tests use `// @vitest-environment node` and have no window.)
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
if (typeof window !== "undefined") window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
