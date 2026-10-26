import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { PageTransitionProvider, TRANSITION_TIMING, usePageTransition } from "./page-transition";

const push = vi.fn();

vi.mock("@/i18n/navigation-base", () => ({
  getPathname: ({ href }: { href: string }) => `/en${href === "/" ? "" : href}`,
  useRouter: () => ({ push }),
}));

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function Trigger({ href }: { href: string }) {
  const t = usePageTransition();
  return (
    <button onClick={() => t?.navigate(href as never)}>go</button>
  );
}

function mount(href = "/about") {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <PageTransitionProvider>
        <Trigger href={href} />
      </PageTransitionProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  push.mockReset();
  // The router updates the URL when the navigation commits.
  push.mockImplementation((href: string) => window.history.pushState({}, "", `/en${href}`));
  window.history.pushState({}, "", "/en");
  (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockClear();
  setReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PageTransitionProvider", () => {
  it("runs close -> swap -> open with the design timing and scrolls to top", () => {
    mount();
    fireEvent.click(screen.getByText("go"));

    const overlay = () => screen.queryByTestId("page-transition");
    expect(overlay()).toHaveAttribute("data-phase", "close");
    expect(overlay()).toHaveTextContent("About Us");
    expect(push).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(TRANSITION_TIMING.swapAfter - 1));
    expect(push).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(1));
    expect(push).toHaveBeenCalledTimes(1);
    expect(overlay()).toHaveAttribute("data-phase", "hold");

    // URL committed on the push; the poll notices and scrolls to top behind the curtains.
    act(() => void vi.advanceTimersByTime(TRANSITION_TIMING.commitPoll));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
    expect(overlay()).toHaveAttribute("data-phase", "hold");

    act(() => void vi.advanceTimersByTime(TRANSITION_TIMING.openAfterCommit));
    expect(overlay()).toHaveAttribute("data-phase", "open");

    act(() => void vi.advanceTimersByTime(TRANSITION_TIMING.openDuration));
    expect(overlay()).toBeNull();
  });

  it("totals about 2.4s for a fast navigation", () => {
    mount();
    fireEvent.click(screen.getByText("go"));
    act(() => void vi.advanceTimersByTime(2300));
    expect(screen.queryByTestId("page-transition")).not.toBeNull();
    act(() => void vi.advanceTimersByTime(200));
    expect(screen.queryByTestId("page-transition")).toBeNull();
  });

  it("keeps the curtains closed until the navigation commits, with a safety timeout", () => {
    push.mockImplementation(() => undefined); // never commits
    mount();
    fireEvent.click(screen.getByText("go"));
    act(() => void vi.advanceTimersByTime(TRANSITION_TIMING.swapAfter + 4000));
    expect(screen.getByTestId("page-transition")).toHaveAttribute("data-phase", "hold");
    act(() => void vi.advanceTimersByTime(1100 + TRANSITION_TIMING.openAfterCommit));
    expect(screen.getByTestId("page-transition")).toHaveAttribute("data-phase", "open");
  });

  it("does nothing special for reduced motion: navigates at once, no overlay", () => {
    setReducedMotion(true);
    mount();
    fireEvent.click(screen.getByText("go"));
    expect(push).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("page-transition")).toBeNull();
    act(() => void vi.advanceTimersByTime(3000));
    expect(screen.queryByTestId("page-transition")).toBeNull();
  });

  it("does not start for the current URL", () => {
    window.history.pushState({}, "", "/en/about");
    mount("/about");
    fireEvent.click(screen.getByText("go"));
    expect(screen.queryByTestId("page-transition")).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("ignores a second navigation while one is running", () => {
    mount();
    fireEvent.click(screen.getByText("go"));
    fireEvent.click(screen.getByText("go"));
    act(() => void vi.advanceTimersByTime(TRANSITION_TIMING.swapAfter));
    expect(push).toHaveBeenCalledTimes(1);
  });
});
