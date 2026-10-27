import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
let pathname = "/en";

vi.mock("@/i18n/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/lib/gsap", () => ({ ScrollTrigger: { refresh } }));

import { GsapRefresh } from "@/components/ui/gsap-refresh";
import { isGsapLoaded, markGsapLoaded, resetGsapLoaded } from "@/lib/gsap-state";
import { GSAP_REFRESH } from "./use-gsap-refresh";

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe("useGsapRefresh (REQ-014)", () => {
  let frame: FrameRequestCallback[] = [];
  let resize: (() => void) | null = null;

  beforeEach(() => {
    refresh.mockClear();
    markGsapLoaded();
    pathname = "/en";
    frame = [];
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frame.push(cb));
    vi.stubGlobal("cancelAnimationFrame", () => {});
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          resize = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("refreshes ScrollTrigger after the route changes", async () => {
    const { rerender } = render(<GsapRefresh />);
    await flush();
    act(() => frame.splice(0).forEach((f) => f(0)));
    expect(refresh).toHaveBeenCalledTimes(1);

    pathname = "/en/about";
    rerender(<GsapRefresh />);
    await flush();
    act(() => frame.splice(0).forEach((f) => f(0)));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("refreshes (debounced) when the page height changes", async () => {
    Object.defineProperty(document.body, "offsetHeight", { configurable: true, value: 2000 });
    render(<GsapRefresh />);
    await flush();
    act(() => frame.splice(0).forEach((f) => f(0)));
    refresh.mockClear();

    act(() => resize?.());
    act(() => resize?.());
    expect(refresh).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(GSAP_REFRESH.debounceMs);
    });
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("B1-07: does not touch GSAP when no section loaded it", async () => {
    resetGsapLoaded();
    expect(isGsapLoaded()).toBe(false);
    render(<GsapRefresh />);
    await flush();
    act(() => frame.splice(0).forEach((f) => f(0)));
    expect(refresh).not.toHaveBeenCalled();
  });
});
