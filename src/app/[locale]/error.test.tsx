import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import LocaleError from "./error";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("R-04 localized error page", () => {
  it.each([
    ["en", "Something went wrong", "Try again"],
    ["ar", "حدث خطأ ما", "إعادة المحاولة"],
  ] as const)("%s: shows the message and a working retry button", (locale, title, retryLabel) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    renderWithIntl(<LocaleError error={new Error("sanity down")} retry={retry} />, locale);
    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: retryLabel }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
