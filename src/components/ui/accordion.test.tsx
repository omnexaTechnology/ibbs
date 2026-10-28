import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Accordion } from "./accordion";

const items = [
  { id: "a", question: "Question A", answer: "Answer A" },
  { id: "b", question: "Question B", answer: "Answer B" },
  { id: "c", question: "Question C", answer: "Answer C" },
];

describe("<Accordion>", () => {
  it("opens the first item by default, with aria-expanded / aria-controls wired to a labelled region", () => {
    render(<Accordion items={items} />);
    const a = screen.getByRole("button", { name: "Question A" });
    const b = screen.getByRole("button", { name: "Question B" });
    expect(a).toHaveAttribute("aria-expanded", "true");
    expect(b).toHaveAttribute("aria-expanded", "false");
    const panel = document.getElementById(a.getAttribute("aria-controls")!)!;
    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-labelledby", a.id);
    expect(panel).toHaveTextContent("Answer A");
  });

  it("is single-open: opening one closes the other, clicking the open one closes it", () => {
    render(<Accordion items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Question B" }));
    expect(screen.getByRole("button", { name: "Question A" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Question B" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Question B" }));
    expect(screen.getByRole("button", { name: "Question B" })).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps closed answers out of the tab order and accessibility tree (inert)", () => {
    render(<Accordion items={items} />);
    const closedPanel = document.getElementById(screen.getByRole("button", { name: "Question C" }).getAttribute("aria-controls")!)!;
    expect(closedPanel.firstElementChild).toHaveAttribute("inert");
    const openPanel = document.getElementById(screen.getByRole("button", { name: "Question A" }).getAttribute("aria-controls")!)!;
    expect(openPanel.firstElementChild).not.toHaveAttribute("inert");
  });

  it("puts each question in a heading", () => {
    render(<Accordion items={items} headingLevel={3} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });

  it("Arrow keys, Home and End move focus between questions", () => {
    render(<Accordion items={items} />);
    const [a, b, c] = ["A", "B", "C"].map((l) => screen.getByRole("button", { name: `Question ${l}` }));
    a.focus();
    fireEvent.keyDown(a, { key: "ArrowDown" });
    expect(b).toHaveFocus();
    fireEvent.keyDown(b, { key: "End" });
    expect(c).toHaveFocus();
    fireEvent.keyDown(c, { key: "ArrowDown" });
    expect(a).toHaveFocus();
    fireEvent.keyDown(a, { key: "ArrowUp" });
    expect(c).toHaveFocus();
    fireEvent.keyDown(c, { key: "Home" });
    expect(a).toHaveFocus();
  });
});
