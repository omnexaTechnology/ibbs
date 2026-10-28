import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import { AboutTabs } from "./about-tabs";

const sel = (name: string) => screen.getByRole("tab", { name: new RegExp(name) });

describe("about tabs (ARIA tabs pattern)", () => {
  it("starts on Vision with one tab stop and a visible panel only for the selected tab", () => {
    renderWithIntl(<AboutTabs />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(sel("Vision")).toHaveAttribute("aria-selected", "true");
    expect(sel("Vision")).toHaveAttribute("tabindex", "0");
    expect(sel("Mission")).toHaveAttribute("tabindex", "-1");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1); // hidden panels are not exposed
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", sel("Vision").id);
    expect(sel("Vision")).toHaveAttribute("aria-controls", screen.getByRole("tabpanel").id);
  });

  it("arrow keys move and wrap, Home/End jump, focus follows", () => {
    renderWithIntl(<AboutTabs />);
    const list = screen.getByRole("tablist");
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(sel("Mission")).toHaveAttribute("aria-selected", "true");
    expect(sel("Mission")).toHaveFocus();
    fireEvent.keyDown(list, { key: "End" });
    expect(sel("Strengths")).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(sel("Vision")).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(list, { key: "ArrowLeft" });
    expect(sel("Strengths")).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(list, { key: "Home" });
    expect(sel("Vision")).toHaveAttribute("aria-selected", "true");
  });

  it("click selects; the panel text follows the tab", () => {
    renderWithIntl(<AboutTabs />);
    fireEvent.click(sel("Mission"));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Comfortable workspaces");
  });

  it("renders Arabic labels and reverses the arrow keys in RTL", () => {
    document.documentElement.dir = "rtl";
    renderWithIntl(<AboutTabs />, "ar");
    const list = screen.getByRole("tablist");
    expect(screen.getByRole("tab", { name: /الرؤية/ })).toBeInTheDocument();
    fireEvent.keyDown(list, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: /الرسالة/ })).toHaveAttribute("aria-selected", "true");
    document.documentElement.dir = "";
  });
});
