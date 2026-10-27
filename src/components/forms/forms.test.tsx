import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import { renderWithIntl } from "@/test/render";
import { CallForm } from "./call-form";
import { ContactForm } from "./contact-form";
import { ProjectForm } from "./project-form";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const WA = "https://wa.me/966500000000?text=hi";
const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe.each([
  { locale: "en", m: en.forms },
  { locale: "ar", m: ar.forms },
] as const)("contact form validation messages ($locale)", ({ locale, m }) => {
  it("shows every required-field error inline in the visitor's language, focuses the first one, sends nothing", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />, locale);
    await user.click(screen.getByRole("button", { name: m.send }));

    const name = screen.getByLabelText(new RegExp(m.fName));
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription(m.errors.nameRequired);
    expect(screen.getByLabelText(new RegExp(m.fPhone))).toHaveAccessibleDescription(m.errors.phoneRequired);
    expect(screen.getByLabelText(m.fEmail)).toHaveAccessibleDescription(m.errors.emailOrMessage);
    expect(screen.getByRole("alert")).toHaveTextContent(m.fInvalid);
    await waitFor(() => expect(name).toHaveFocus());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid phone and email", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />, locale);
    await user.type(screen.getByLabelText(new RegExp(m.fName)), "Sara");
    await user.type(screen.getByLabelText(new RegExp(m.fPhone)), "12345");
    await user.type(screen.getByLabelText(m.fEmail), "not-an-email");
    await user.click(screen.getByRole("button", { name: m.send }));

    expect(screen.getByLabelText(new RegExp(m.fPhone))).toHaveAccessibleDescription(m.errors.phoneInvalid);
    expect(screen.getByLabelText(m.fEmail)).toHaveAccessibleDescription(m.errors.emailInvalid);
    expect(screen.getByLabelText(new RegExp(m.fName))).not.toHaveAttribute("aria-invalid");
    await waitFor(() => expect(screen.getByLabelText(new RegExp(m.fPhone))).toHaveFocus());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("submission", () => {
  async function fillAndSend(locale: "en" | "ar", node = <ContactForm whatsappHref={WA} />) {
    const m = locale === "ar" ? ar.forms : en.forms;
    const user = userEvent.setup();
    renderWithIntl(node, locale);
    await user.type(screen.getByLabelText(new RegExp(m.fName)), "Sara");
    await user.type(screen.getByLabelText(new RegExp(m.fPhone)), "0501234567");
    await user.type(screen.getByLabelText(m.fMsg), "Need desks");
    await user.selectOptions(screen.getByLabelText(m.fType), "mosque");
    await user.click(screen.getByRole("button", { name: m.send }));
    return { user, m };
  }

  it("posts locale, page URL, form type and the fields; shows success; 'send another' resets", async () => {
    fetchMock.mockReturnValue(json(200, { ok: true }));
    const { user, m } = await fillAndSend("ar");

    expect(await screen.findByTestId("form-success")).toHaveTextContent(m.okTitle);
    expect(screen.getByTestId("form-success")).toHaveFocus();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/leads");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ formType: "contact", locale: "ar", name: "Sara", phone: "0501234567", message: "Need desks", spaceType: "mosque", website: "" });
    expect(body.pageUrl).toBe(`${window.location.origin}${window.location.pathname}`);
    expect(typeof body.elapsedMs).toBe("number");

    await user.click(screen.getByRole("button", { name: m.okAgain }));
    expect(screen.getByLabelText(new RegExp(m.fName))).toHaveValue("");
  });

  it("delivery failure shows the error and the WhatsApp fallback; never a success", async () => {
    fetchMock.mockReturnValue(json(502, { ok: false, error: "delivery_failed" }));
    await fillAndSend("en");
    expect(await screen.findByTestId("form-alert")).toHaveTextContent(en.forms.fFailed);
    expect(screen.getByTestId("form-whatsapp")).toHaveAttribute("href", WA);
    expect(screen.queryByTestId("form-success")).not.toBeInTheDocument();
  });

  it("network failure is an error too; WhatsApp link is hidden when no number is set", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));
    await fillAndSend("en", <ContactForm whatsappHref={null} />);
    expect(await screen.findByTestId("form-alert")).toBeInTheDocument();
    expect(screen.queryByTestId("form-whatsapp")).not.toBeInTheDocument();
  });

  it("server field errors (400) are shown inline", async () => {
    fetchMock.mockReturnValue(json(400, { ok: false, error: "invalid", fields: { phone: "phoneInvalid" } }));
    await fillAndSend("en");
    expect(await screen.findByLabelText(new RegExp(en.forms.fPhone))).toHaveAccessibleDescription(en.forms.errors.phoneInvalid);
  });

  it("project form sends formType project and shows its heading", async () => {
    fetchMock.mockReturnValue(json(200, { ok: true }));
    renderWithIntl(<ProjectForm />, "en");
    expect(screen.getByRole("heading", { name: en.forms.formTitle })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(new RegExp(en.forms.fName)), "Sara");
    await user.type(screen.getByLabelText(new RegExp(en.forms.fPhone)), "+966501234567");
    await user.type(screen.getByLabelText(en.forms.fEmail), "sara@example.test");
    await user.click(screen.getByRole("button", { name: en.forms.send }));
    await screen.findByTestId("form-success");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).formType).toBe("project");
  });

  it("call form needs only a phone, has its own thank-you text", async () => {
    fetchMock.mockReturnValue(json(200, { ok: true }));
    const user = userEvent.setup();
    renderWithIntl(<CallForm />, "ar");
    await user.click(screen.getByRole("button", { name: ar.forms.sendQuick }));
    expect(screen.getByLabelText(new RegExp(ar.forms.fPhone))).toHaveAccessibleDescription(ar.forms.errors.phoneRequired);
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(new RegExp(ar.forms.fPhone)), "0501234567");
    await user.click(screen.getByRole("button", { name: ar.forms.sendQuick }));
    expect(await screen.findByTestId("form-success")).toHaveTextContent(ar.forms.quickDone);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ formType: "call", locale: "ar", phone: "0501234567" });
  });

  it("the honeypot field is hidden from assistive tech and out of the tab order", () => {
    renderWithIntl(<ContactForm />, "en");
    const trap = document.querySelector<HTMLInputElement>('input[name="website"]')!;
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
