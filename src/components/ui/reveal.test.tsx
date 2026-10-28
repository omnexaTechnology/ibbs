import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockIntersectionObserver, setReducedMotion, type IOHandle } from "@/test/dom-mocks";
import { Reveal } from "./reveal";

let io: IOHandle;
beforeEach(() => {
  setReducedMotion(false);
  io = mockIntersectionObserver();
  // jsdom has no CSS.supports: pretend scroll-driven animations are unavailable unless a test says otherwise.
  vi.stubGlobal("CSS", { supports: () => false });
});
afterEach(() => {
  io.restore();
  vi.unstubAllGlobals();
});

describe("<Reveal>", () => {
  it("renders its content (visible in server HTML, no hidden state without JS)", () => {
    render(<Reveal>hello</Reveal>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("fallback: waits, then plays once the element is seen", () => {
    render(<Reveal>hello</Reveal>);
    const el = screen.getByText("hello");
    expect(el).toHaveAttribute("data-reveal", "wait");
    act(() => io.fire(true));
    expect(el).toHaveAttribute("data-reveal", "go");
  });

  it("uses CSS scroll-driven animation where supported", () => {
    vi.stubGlobal("CSS", { supports: () => true });
    render(<Reveal variant="image">pic</Reveal>);
    const el = screen.getByText("pic");
    expect(el).toHaveAttribute("data-reveal", "view");
    expect(el).toHaveClass("ui-rv-img");
  });

  it("BR-001: reduced motion leaves the element untouched", () => {
    setReducedMotion(true);
    render(<Reveal>hello</Reveal>);
    expect(screen.getByText("hello")).not.toHaveAttribute("data-reveal");
  });
});
