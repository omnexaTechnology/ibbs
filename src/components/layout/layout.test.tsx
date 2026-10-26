import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSettings, renderWithIntl } from "@/test/render";
import { Footer } from "./footer";
import { Header } from "./header";
import { isNavActive } from "./nav-items";
import { WhatsAppButton } from "./whatsapp-button";

let mockPathname = "/";

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react");
  const MockLink = ({ href, children, ...props }: Record<string, unknown>) => {
    const { locale: _l, scroll: _s, ...rest } = props;
    void _l;
    void _s;
    const obj = href as { pathname: string; query: { category: string } };
    const url = typeof href === "string" ? href : `${obj.pathname}?category=${obj.query.category}`;
    return React.createElement("a", { href: url, ...rest }, children as React.ReactNode);
  };
  return { usePathname: () => mockPathname, PlainLink: MockLink, Link: MockLink };
});
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

function setScrollY(value: number) {
  act(() => {
    (window as unknown as { scrollY: number }).scrollY = value;
    window.dispatchEvent(new Event("scroll"));
  });
}

beforeEach(() => {
  mockPathname = "/";
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
});

describe("isNavActive", () => {
  it("home is active only on /", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/about", "/")).toBe(false);
  });
  it("section is active on itself and sub-pages", () => {
    expect(isNavActive("/projects", "/projects")).toBe(true);
    expect(isNavActive("/projects/exec-hq", "/projects")).toBe(true);
    expect(isNavActive("/projects-archive", "/projects")).toBe(false);
    expect(isNavActive("/about", "/projects")).toBe(false);
  });
});

describe("Header", () => {
  it("marks Projects as the current page on a project detail page", async () => {
    mockPathname = "/projects/exec-hq";
    renderWithIntl(<Header settings={await makeSettings()} />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const current = nav.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Projects");
  });

  it("marks Home current on /", async () => {
    renderWithIntl(<Header settings={await makeSettings()} />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent("Home");
  });

  it("becomes scrolled after 24px", async () => {
    renderWithIntl(<Header settings={await makeSettings()} />);
    const header = screen.getByTestId("site-header");
    expect(header).toHaveAttribute("data-scrolled", "false");
    setScrollY(24);
    expect(header).toHaveAttribute("data-scrolled", "false");
    setScrollY(25);
    expect(header).toHaveAttribute("data-scrolled", "true");
  });

  it("opens the mobile menu with the button and closes it with Escape", async () => {
    renderWithIntl(<Header settings={await makeSettings()} />);
    const button = screen.getByTestId("menu-button");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("mobile-menu")).toBeNull();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("mobile-menu")).toBeNull();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the mobile menu when the route changes", async () => {
    const settings = await makeSettings();
    const { rerender } = renderWithIntl(<Header settings={settings} />);
    fireEvent.click(screen.getByTestId("menu-button"));
    expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    mockPathname = "/about";
    rerender(<Header settings={settings} />);
    expect(screen.queryByTestId("mobile-menu")).toBeNull();
  });

  it("hides the top bar and social icons when nothing is configured", async () => {
    const settings = await makeSettings({ emails: [], phones: [] });
    renderWithIntl(<Header settings={settings} />);
    expect(screen.queryByTestId("topbar")).toBeNull();
    expect(screen.queryByTestId("social-links")).toBeNull();
  });
});

describe("Footer", () => {
  it("renders no social links or placeholder anchors when social URLs are empty", async () => {
    renderWithIntl(<Footer settings={await makeSettings()} />);
    expect(screen.queryByTestId("social-links")).toBeNull();
    expect(screen.queryByRole("link", { name: "LinkedIn" })).toBeNull();
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).not.toContain("#");
  });

  it("renders only the social profiles that are set", async () => {
    const base = await makeSettings();
    const settings = await makeSettings({
      social: { ...base.social, linkedin: "https://linkedin.com/company/ibss", tiktok: "https://tiktok.com/@ibss" },
    });
    renderWithIntl(<Footer settings={settings} />);
    const links = screen.getByTestId("social-links").querySelectorAll("a");
    expect([...links].map((a) => a.getAttribute("data-platform"))).toEqual(["linkedin", "tiktok"]);
    expect(screen.queryByRole("link", { name: "Instagram" })).toBeNull();
  });

  it("hides empty contact rows and the whole block when everything is empty", async () => {
    const onlyEmail = await makeSettings({ phones: ["", " "], website: "", address: { en: "", ar: "" } });
    const { unmount } = renderWithIntl(<Footer settings={onlyEmail} />);
    expect(screen.queryByText("Phone")).toBeNull();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.queryByText("Website")).toBeNull();
    unmount();

    const none = await makeSettings({ phones: [], emails: [], website: "", address: { en: "", ar: "" } });
    renderWithIntl(<Footer settings={none} />);
    expect(screen.queryByTestId("footer-contact")).toBeNull();
  });

  it("links address to the map only when a map URL is set", async () => {
    const { unmount } = renderWithIntl(<Footer settings={await makeSettings()} />);
    expect(screen.queryByRole("link", { name: "[Office address]" })).toBeNull();
    unmount();
    renderWithIntl(<Footer settings={await makeSettings({ mapUrl: "https://maps.example/x" })} />);
    expect(screen.getByRole("link", { name: "[Office address]" })).toHaveAttribute("href", "https://maps.example/x");
  });

  it("links categories to the filtered projects page", async () => {
    renderWithIntl(<Footer settings={await makeSettings()} />);
    expect(screen.getByRole("link", { name: "Mosques" })).toHaveAttribute("href", "/projects?category=mosque");
  });
});

describe("WhatsAppButton", () => {
  it("uses the per-locale prefilled message", async () => {
    const settings = await makeSettings();
    const { unmount } = renderWithIntl(<WhatsAppButton settings={settings} />, "en");
    const en = screen.getByTestId("whatsapp-button").getAttribute("href")!;
    expect(en).toMatch(/^https:\/\/wa\.me\/966500000000\?text=/);
    expect(decodeURIComponent(en)).toContain("Hello IBSS Innovations");
    unmount();
    renderWithIntl(<WhatsAppButton settings={settings} />, "ar");
    expect(decodeURIComponent(screen.getByTestId("whatsapp-button").getAttribute("href")!)).toContain("مرحباً");
  });

  it("is not rendered without a number", async () => {
    const base = await makeSettings();
    renderWithIntl(<WhatsAppButton settings={{ ...base, whatsapp: { ...base.whatsapp, number: "" } }} />);
    expect(screen.queryByTestId("whatsapp-button")).toBeNull();
  });
});
