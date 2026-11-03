import { describe, expect, it, vi } from "vitest";
import { coverSizes } from "./sanity-image";

// next-sanity/image imports "next/image" without an extension, which Vitest's Node resolver cannot load
vi.mock("next-sanity/image", () => ({ Image: () => null }));

describe("coverSizes", () => {
  const sizes = "(min-width: 1280px) 300px, (min-width: 640px) 45vw, 66vw";

  it("scales each length by how much wider the image is than its box, leaving media conditions alone", () => {
    // 1600x800 (2) in a 0.8 box: drawn 2.5x the box width
    expect(coverSizes(sizes, { width: 1600, height: 800 }, 0.8)).toBe("(min-width: 1280px) 750px, (min-width: 640px) 113vw, 165vw");
  });

  it("keeps sizes as is when the image is not wider than the box, or its size is unknown", () => {
    expect(coverSizes(sizes, { width: 600, height: 900 }, 0.8)).toBe(sizes);
    expect(coverSizes(sizes, { width: 0, height: 0 }, 0.8)).toBe(sizes);
  });
});
