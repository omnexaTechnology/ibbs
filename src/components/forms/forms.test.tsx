import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
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

const m_email = () => en.forms.fEmail;
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
    expect(body).toMatchObject({ formType: "contact", locale: "ar", name: "Sara", phone: "0501234567", message: "Need desks", spaceType: "mosque", hp_extra: "" });
    expect(body.pageUrl).toBe(window.location.pathname);
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

  it("every form posts (never a native GET) and its submit button is enabled once mounted (F4-01)", async () => {
    renderWithIntl(
      <>
        <ContactForm />
        <ProjectForm />
        <CallForm />
      </>,
      "en",
    );
    for (const id of ["contact-form", "project-form", "call-form"]) expect(screen.getByTestId(id)).toHaveAttribute("method", "post");
    for (const b of screen.getAllByRole("button")) expect(b).toBeEnabled();
  });

  it("server-rendered submit buttons are disabled and forms post (F4-01, R2-07)", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={en}>
        <ContactForm />
        <ProjectForm />
        <CallForm />
      </NextIntlClientProvider>,
    );
    const buttons = html.match(/<button[^>]*type="submit"[^>]*>/g) ?? [];
    expect(buttons).toHaveLength(3);
    for (const b of buttons) expect(b).toMatch(/\sdisabled=""/);
    expect(html.match(/<form[^>]*method="post"/g)).toHaveLength(3);
  });

  it("typed before hydration: the timer starts at page load, so an immediate send is not 'too fast' (R2-01)", async () => {
    fetchMock.mockReturnValue(json(200, { ok: true }));
    const tree = (
      <NextIntlClientProvider locale="en" messages={en}>
        <ContactForm />
      </NextIntlClientProvider>
    );
    const host = document.createElement("div");
    document.body.append(host);
    host.innerHTML = renderToString(tree);
    host.querySelector<HTMLInputElement>('input[name="name"]')!.value = "Sara";
    host.querySelector<HTMLInputElement>('input[name="phone"]')!.value = "0501234567";
    host.querySelector<HTMLTextAreaElement>('textarea[name="message"]')!.value = "hi";
    await act(async () => {
      hydrateRoot(host, tree);
    });
    await userEvent.setup().click(within(host).getByRole("button", { name: en.forms.send }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).elapsedMs).toBeGreaterThanOrEqual(2_000);
    host.remove();
  });

  it("required fields are announced with aria-required; inputs carry maxLength (F4-06, F4-12)", () => {
    renderWithIntl(<ContactForm />, "en");
    expect(screen.getByLabelText(new RegExp(en.forms.fName))).toHaveAttribute("aria-required", "true");
    expect(screen.getByLabelText(m_email())).not.toHaveAttribute("aria-required");
    expect(screen.getByLabelText(m_email())).toHaveAttribute("maxlength", "254");
  });

  it("double submit while sending posts once", async () => {
    let resolve!: (r: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    const { user, m } = await fillAndSend("en");
    const btn = screen.getByRole("button", { name: en.forms.sending });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(fetchMock).toHaveBeenCalledOnce();
    resolve(new Response("{}", { status: 200 }));
    await screen.findByTestId("form-success");
    void m;
  });

  it("after a server 400 the timing clock keeps running: the resend reports a larger elapsedMs (F4-02)", async () => {
    fetchMock.mockReturnValueOnce(json(400, { ok: false, error: "invalid", fields: { phone: "phoneInvalid" } })).mockReturnValueOnce(json(200, { ok: true }));
    const { user } = await fillAndSend("en");
    await screen.findByText(en.forms.errors.phoneInvalid);
    const first = JSON.parse(fetchMock.mock.calls[0][1].body).elapsedMs;
    await new Promise((r) => setTimeout(r, 30));
    await user.click(screen.getByRole("button", { name: en.forms.send }));
    await screen.findByTestId("form-success");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).elapsedMs).toBeGreaterThanOrEqual(first + 30);
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
    const trap = document.querySelector<HTMLInputElement>('input[name="hp_extra"]')!;
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap).toHaveAttribute("data-1p-ignore");
    expect(trap).toHaveAttribute("data-lpignore", "true");
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
