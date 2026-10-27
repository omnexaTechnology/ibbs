import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { mockIntersectionObserver, setReducedMotion, type IOHandle } from "@/test/dom-mocks";
import { Carousel, CAROUSEL } from "./carousel";

const items = ["One", "Two", "Three", "Four"].map((s) => <p key={s}>{s}</p>);
const active = () => screen.getAllByTestId("carousel-slide").findIndex((s) => s.dataset.active === "true");
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

let io: IOHandle;
beforeEach(() => {
  vi.useFakeTimers();
  setReducedMotion(false);
  io = mockIntersectionObserver({ auto: true });
});
afterEach(() => {
  vi.useRealTimers();
  io.restore();
});

describe("<Carousel>", () => {
  it("renders an accessible carousel with slide groups and one dot per slide", () => {
    renderWithIntl(<Carousel items={items} label="Hero" />);
    expect(screen.getByRole("region", { name: "Hero" })).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getAllByRole("group", { name: /Slide \d of 4/, hidden: true })).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: /Go to slide/ })).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Go to slide 1" })).toHaveAttribute("aria-current", "true");
  });

  it("dots jump to a slide", () => {
    renderWithIntl(<Carousel items={items} label="Hero" />);
    fireEvent.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(active()).toBe(2);
    expect(screen.getByRole("button", { name: "Go to slide 3" })).toHaveAttribute("aria-current", "true");
  });

  it("arrow buttons wrap around", () => {
    renderWithIntl(<Carousel items={items} label="Hero" />);
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(active()).toBe(3);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(active()).toBe(0);
  });

  it("keyboard: ArrowRight/Left, Home and End in LTR", () => {
    renderWithIntl(<Carousel items={items} label="Hero" />);
    const region = screen.getByRole("region");
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(active()).toBe(1);
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(active()).toBe(0);
    fireEvent.keyDown(region, { key: "End" });
    expect(active()).toBe(3);
    fireEvent.keyDown(region, { key: "Home" });
    expect(active()).toBe(0);
  });

  it("keyboard follows the visual direction in RTL (ArrowLeft = next)", () => {
    renderWithIntl(<Carousel items={items} label="Hero" dir="rtl" />, "ar");
    const region = screen.getByRole("region");
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(active()).toBe(1);
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(active()).toBe(0);
  });

  it("auto-advances every 5 s and a manual change restarts the countdown", () => {
    renderWithIntl(<Carousel items={items} label="Hero" />);
    tick(CAROUSEL.interval - 1);
    expect(active()).toBe(0);
    tick(1);
    expect(active()).toBe(1);
    tick(3000);
    fireEvent.click(screen.getByRole("button", { name: "Go to slide 4" }));
    tick(3000);
    expect(active()).toBe(3);
    tick(2000);
    expect(active()).toBe(0);
  });

  it("BR-001: reduced motion turns auto-advance off", () => {
    setReducedMotion(true);
    renderWithIntl(<Carousel items={items} label="Hero" />);
    tick(CAROUSEL.interval * 3);
    expect(active()).toBe(0);
    // manual control still works
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowRight" });
    expect(active()).toBe(1);
  });

  it("pauses on hover and keyboard focus, resumes after", () => {
    renderWithIntl(<Carousel items={items} label="Hero" />);
    const region = screen.getByRole("region");
    fireEvent.mouseEnter(region);
    tick(CAROUSEL.interval * 2);
    expect(active()).toBe(0);
    fireEvent.mouseLeave(region);
    tick(CAROUSEL.interval);
    expect(active()).toBe(1);
    fireEvent.focus(screen.getByRole("button", { name: "Go to slide 1" }));
    tick(CAROUSEL.interval * 2);
    expect(active()).toBe(1);
  });

  it("does not advance while off-screen", () => {
    io.restore();
    io = mockIntersectionObserver();
    renderWithIntl(<Carousel items={items} label="Hero" />);
    tick(CAROUSEL.interval * 2);
    expect(active()).toBe(0);
    act(() => io.fire(true));
    tick(CAROUSEL.interval);
    expect(active()).toBe(1);
    act(() => io.fire(false));
    tick(CAROUSEL.interval * 2);
    expect(active()).toBe(1);
  });

  it("only the active slide is reachable (inert) and reports onIndexChange", () => {
    const onChange = vi.fn();
    renderWithIntl(<Carousel items={items} label="Hero" onIndexChange={onChange} />);
    const slides = screen.getAllByTestId("carousel-slide");
    expect(slides[0]).not.toHaveAttribute("inert");
    expect(slides[1]).toHaveAttribute("inert");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
