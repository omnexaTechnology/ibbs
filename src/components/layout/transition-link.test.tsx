import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Link } from "./transition-link";

const navigate = vi.fn();

vi.mock("./page-transition", () => ({
  usePageTransition: () => ({ navigate, active: false }),
}));
vi.mock("@/i18n/navigation-base", async () => {
  const React = await import("react");
  return {
    Link: ({ href, locale: _l, children, ...rest }: Record<string, unknown>) => {
      void _l;
      return React.createElement("a", { href: href as string, ...rest }, children as React.ReactNode);
    },
  };
});

beforeEach(() => {
  navigate.mockReset();
  navigate.mockReturnValue(true);
});

function click(props: Record<string, unknown> = {}, init: MouseEventInit = {}) {
  render(
    <Link href="/about" {...props}>
      About
    </Link>,
  );
  const a = screen.getByText("About");
  const notPrevented = fireEvent.click(a, { button: 0, ...init });
  return { prevented: !notPrevented };
}

describe("transition-aware Link", () => {
  it("plays the transition on a plain click and suppresses the default navigation", () => {
    const { prevented } = click();
    expect(navigate).toHaveBeenCalledWith("/about", { label: undefined });
    expect(prevented).toBe(true);
  });

  it("passes a custom curtain label", () => {
    click({ transitionLabel: "Executive Headquarters" });
    expect(navigate).toHaveBeenCalledWith("/about", { label: "Executive Headquarters" });
  });

  it.each([
    ["ctrl-click", {}, { ctrlKey: true }],
    ["meta-click", {}, { metaKey: true }],
    ["shift-click", {}, { shiftKey: true }],
    ["middle click", {}, { button: 1 }],
    ["target=_blank", { target: "_blank" }, {}],
    ["locale switch", { locale: "ar" }, {}],
  ])("leaves %s to the browser/Next", (_name, props, init) => {
    const { prevented } = click(props, init);
    expect(navigate).not.toHaveBeenCalled();
    expect(prevented).toBe(false);
  });

  it.each(["#top", "https://example.com", "mailto:a@b.c", "tel:+966500000000"])("ignores %s", (href) => {
    click({ href });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("falls back to normal navigation when the target is the current page", () => {
    navigate.mockReturnValue(false);
    const { prevented } = click();
    expect(prevented).toBe(false);
  });

  it("respects a caller that already prevented the click", () => {
    click({ onClick: (e: React.MouseEvent) => e.preventDefault() });
    expect(navigate).not.toHaveBeenCalled();
  });
});
