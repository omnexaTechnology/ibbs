import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockIntersectionObserver, setReducedMotion, type IOHandle } from "@/test/dom-mocks";
import { Counter, COUNTER, countAt, easeOutCubic } from "./counter";

describe("count maths", () => {
  it("is 0 at the start, the end value at the end, and eases out", () => {
    expect(countAt(0, 120)).toBe(0);
    expect(countAt(1, 120)).toBe(120);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
    expect(countAt(0.5, 120)).toBe(105);
    expect(countAt(2, 120)).toBe(120);
    expect(countAt(-1, 120)).toBe(0);
  });

  it("supports decimals and a start value", () => {
    expect(countAt(1, 4.8, 0, 1)).toBe(4.8);
    expect(countAt(0, 100, 50)).toBe(50);
  });
});

describe("<Counter>", () => {
  let io: IOHandle;
  let now = 0;
  let frames: FrameRequestCallback[] = [];

  const runFrames = (to: number) => {
    now = to;
    const batch = frames;
    frames = [];
    act(() => batch.forEach((f) => f(now)));
  };

  beforeEach(() => {
    now = 0;
    frames = [];
    setReducedMotion(false);
    io = mockIntersectionObserver();
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal("cancelAnimationFrame", () => {
      frames = [];
    });
  });
  afterEach(() => {
    io.restore();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("starts at 0, waits for the band to be visible, then counts to the end value once", () => {
    render(<Counter to={120} suffix="+" />);
    expect(screen.getByTestId("counter-value")).toHaveTextContent("0+");
    runFrames(500);
    expect(screen.getByTestId("counter-value")).toHaveTextContent("0+");

    act(() => io.fire(true));
    const t0 = now; // the count starts when the band becomes visible
    runFrames(t0);
    runFrames(t0 + COUNTER.duration / 2);
    const mid = Number(screen.getByTestId("counter-value").textContent!.replace(/\D/g, ""));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(120);

    runFrames(t0 + COUNTER.duration);
    expect(screen.getByTestId("counter-value")).toHaveTextContent("120+");
    expect(frames).toHaveLength(0);

    // leaving and re-entering the viewport does not restart it
    act(() => io.fire(false));
    act(() => io.fire(true));
    runFrames(t0 + COUNTER.duration * 2);
    expect(screen.getByTestId("counter-value")).toHaveTextContent("120+");
  });

  it("always exposes the final value to assistive technology", () => {
    render(<Counter to={1500} suffix="+" />);
    expect(screen.getByTestId("counter-final")).toHaveTextContent("1,500+");
    expect(screen.getByTestId("counter-value")).toHaveAttribute("aria-hidden", "true");
  });

  it("BR-001: reduced motion shows the end value immediately and never animates", () => {
    setReducedMotion(true);
    render(<Counter to={120} />);
    expect(screen.getByTestId("counter-value")).toHaveTextContent("120");
    act(() => io.fire(true));
    runFrames(100);
    expect(screen.getByTestId("counter-value")).toHaveTextContent("120");
  });
});
