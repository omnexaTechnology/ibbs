import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { emptySettings, makeSettings, renderWithIntl } from "@/test/render";
import { ContactCards } from "./contact-cards";
import { ContactFormSection } from "./contact-form-slot";
import { ContactMap } from "./contact-map";
import { ContactWhatsApp } from "./contact-whatsapp";
import { LegalPage } from "../legal/legal-page";
import { getLegalDoc } from "@/content/legal";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("<LegalPage>", () => {
  it("R2-08/R2-09: mailto opens in place; the contents nav is not named like the H1", async () => {
    const doc = getLegalDoc("en", "privacy");
    renderWithIntl(<LegalPage doc={doc} settings={await makeSettings()} />);
    expect(screen.getByRole("link", { name: "info@example.com" })).not.toHaveAttribute("target");
    expect(screen.getByRole("navigation", { name: "Contents" })).toBeInTheDocument();
  });
});

describe("contact blocks with data from the site settings", () => {
  it("cards show phones, emails, website, address and hours; a phone changed in settings is shown", async () => {
    const settings = await makeSettings({ phones: [{ label: { en: "", ar: "" }, value: "+966 11 222 3333" }], mapUrl: "https://maps.google.com/?q=ibss" });
    renderWithIntl(<ContactCards settings={settings} />);
    const phones = screen.getByTestId("contact-phones");
    expect(phones).toHaveTextContent("+966 11 222 3333");
    expect(phones.querySelector("a")).toHaveAttribute("href", "tel:+966112223333");
    expect(screen.getByTestId("contact-emails")).toHaveTextContent("info@example.com");
    expect(screen.getByTestId("contact-website")).toHaveTextContent("www.example.com");
    expect(screen.getByTestId("contact-hours")).toHaveTextContent("Sun – Thu: 9:00 AM – 6:00 PM");
    expect(screen.getByTestId("contact-address").querySelector("a")).toHaveAttribute("href", "https://maps.google.com/?q=ibss");
  });

  it("uses the Arabic values in the Arabic locale", async () => {
    renderWithIntl(<ContactCards settings={await makeSettings()} />, "ar");
    expect(screen.getByTestId("contact-hours")).toHaveTextContent("الأحد – الخميس");
    expect(screen.getByTestId("contact-address")).toHaveTextContent("[عنوان المكتب]");
  });

  it("address without a map link is plain text", async () => {
    renderWithIntl(<ContactCards settings={await makeSettings({ mapUrl: "" })} />);
    expect(screen.getByTestId("contact-address").querySelector("a")).toBeNull();
  });

  it("every block hides when the settings are empty (production state)", async () => {
    const empty = await emptySettings();
    const { container } = renderWithIntl(
      <>
        <ContactCards settings={empty} />
        <ContactWhatsApp settings={empty} />
        <ContactMap settings={empty} />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("ignores non-http map and website links", async () => {
    const s = await makeSettings({ mapUrl: "javascript:alert(1)", website: "ftp://x" });
    renderWithIntl(<ContactMap settings={s} />);
    expect(screen.queryByRole("link", { name: /Google Maps/ })).toBeNull();
    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
  });

  it("map block shows the Google Maps button when a link is set", async () => {
    renderWithIntl(<ContactMap settings={await makeSettings({ mapUrl: "https://maps.google.com/?q=ibss" })} />);
    expect(screen.getByRole("link", { name: /Open in Google Maps/ })).toHaveAttribute("href", "https://maps.google.com/?q=ibss");
  });

  it("WhatsApp block links to wa.me with the prefilled message", async () => {
    renderWithIntl(<ContactWhatsApp settings={await makeSettings()} />);
    expect(screen.getByTestId("contact-whatsapp").getAttribute("href")).toMatch(/^https:\/\/wa\.me\/966500000000\?text=/);
  });

  it("the form slot holds the contact form (method=post)", async () => {
    renderWithIntl(<ContactFormSection settings={await emptySettings()} />);
    const slot = screen.getByTestId("contact-form-slot");
    expect(slot).toHaveAttribute("data-slot", "contact-form");
    expect(slot.querySelector("form")).toHaveAttribute("method", "post");
    expect(screen.queryByTestId("social-links")).toBeNull();
  });
});
