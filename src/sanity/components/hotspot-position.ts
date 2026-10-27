/** Pure helper for the click-to-place hotspot input (unit tested). */
export type PercentPoint = { x: number; y: number };

const clamp = (n: number) => Math.min(100, Math.max(0, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Converts a click position into percentages of the image box (0..100, one decimal).
 * The design places hotspots with `left: x%; top: y%`, so x is measured from the LEFT edge
 * (also in Arabic/RTL pages).
 */
export function clickToPercent(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
): PercentPoint | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: round1(clamp(((clientX - rect.left) / rect.width) * 100)),
    y: round1(clamp(((clientY - rect.top) / rect.height) * 100)),
  };
}
