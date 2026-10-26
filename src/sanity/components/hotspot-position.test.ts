import { describe, expect, it } from "vitest";
import { clickToPercent } from "./hotspot-position";

const rect = { left: 100, top: 50, width: 400, height: 200 };

describe("clickToPercent", () => {
  it("maps a click to percentages from the left/top edge", () => {
    expect(clickToPercent(rect, 300, 150)).toEqual({ x: 50, y: 50 });
    expect(clickToPercent(rect, 100, 50)).toEqual({ x: 0, y: 0 });
    expect(clickToPercent(rect, 500, 250)).toEqual({ x: 100, y: 100 });
  });
  it("rounds to one decimal and clamps to 0..100", () => {
    expect(clickToPercent(rect, 101, 51)).toEqual({ x: 0.3, y: 0.5 });
    expect(clickToPercent(rect, 0, 9999)).toEqual({ x: 0, y: 100 });
  });
  it("returns null for an empty box", () => {
    expect(clickToPercent({ left: 0, top: 0, width: 0, height: 10 }, 1, 1)).toBeNull();
  });
});
