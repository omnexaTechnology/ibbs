import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { swipeDirection } from "@/hooks/use-swipe";
import { Lightbox } from "./lightbox";

const images = [1, 2, 3].map((n) => ({ src: `/img-${n}.jpg`, alt: `Image ${n}` }));

function Harness({ start = 0, onClose = vi.fn() }: { start?: number; onClose?: () => void }) {
  const [i, setI] = useState(start);
  return (
    <>
      <button onClick={() => setI(0)}>opener</button>
      <Lightbox
        images={images}
        index={i}
        onIndexChange={setI}
        onClose={() => {
          onClose();
          setI(-1);
        }}
        label="Gallery"
      />
    </>
  );
}

const shown = () => screen.getByRole("img").getAttribute("alt");

describe("<Lightbox>", () => {
  it("renders nothing when closed", () => {
    renderWithIntl(<Harness start={-1} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is a labelled modal dialog showing the image and a counter", () => {
    renderWithIntl(<Harness />);
    expect(screen.getByRole("dialog", { name: "Gallery" })).toHaveAttribute("aria-modal", "true");
    expect(shown()).toBe("Image 1");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("keyboard: ArrowRight/ArrowLeft wrap around, Escape closes", () => {
    const onClose = vi.fn();
    renderWithIntl(<Harness onClose={onClose} />);
    const dlg = screen.getByRole("dialog");
    fireEvent.keyDown(dlg, { key: "ArrowLeft" });
    expect(shown()).toBe("Image 3");
    fireEvent.keyDown(dlg, { key: "ArrowRight" });
    expect(shown()).toBe("Image 1");
    fireEvent.keyDown(dlg, { key: "ArrowRight" });
    expect(shown()).toBe("Image 2");
    fireEvent.keyDown(dlg, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("buttons navigate and close; backdrop click closes", () => {
    renderWithIntl(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(shown()).toBe("Image 2");
    fireEvent.click(screen.getByRole("button", { name: "Previous image" }));
    expect(shown()).toBe("Image 1");
    fireEvent.click(screen.getByTestId("lightbox"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("B1-04: the dialog itself can take focus, so keys keep working after a click on the image", () => {
    renderWithIntl(<Harness />);
    expect(screen.getByRole("dialog")).toHaveAttribute("tabindex", "-1");
  });

  it("B1-13: a drag that ends on the backdrop does not close it", () => {
    const onClose = vi.fn();
    renderWithIntl(<Harness onClose={onClose} />);
    const dlg = screen.getByRole("dialog");
    fireEvent.pointerDown(dlg, { clientX: 300, clientY: 100 });
    fireEvent.pointerUp(dlg, { clientX: 150, clientY: 100 });
    fireEvent.click(dlg, { detail: 1 });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(dlg, { detail: 1 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("R2-01: a keyboard click (detail 0) after a swipe is not swallowed", () => {
    const onClose = vi.fn();
    renderWithIntl(<Harness onClose={onClose} />);
    const dlg = screen.getByRole("dialog");
    fireEvent.pointerDown(dlg, { clientX: 300, clientY: 100 });
    fireEvent.pointerUp(dlg, { clientX: 150, clientY: 100 });
    const close = screen.getByRole("button", { name: "Close image viewer" });
    fireEvent.click(close, { detail: 0 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("R2-02: Tab and Shift+Tab from the dialog root re-enter the cycle", () => {
    renderWithIntl(<Harness />);
    const dlg = screen.getByRole("dialog");
    dlg.focus();
    fireEvent.keyDown(dlg, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Next image" })).toHaveFocus();
    dlg.focus();
    fireEvent.keyDown(dlg, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Close image viewer" })).toHaveFocus();
  });

  it("swipe left goes to the next image, swipe right to the previous", () => {
    renderWithIntl(<Harness />);
    const dlg = screen.getByRole("dialog");
    fireEvent.pointerDown(dlg, { clientX: 300, clientY: 100 });
    fireEvent.pointerUp(dlg, { clientX: 150, clientY: 110 });
    expect(shown()).toBe("Image 2");
    fireEvent.pointerDown(dlg, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(dlg, { clientX: 260, clientY: 90 });
    expect(shown()).toBe("Image 1");
  });

  it("ignores short or mostly vertical drags", () => {
    expect(swipeDirection(30, 0)).toBeNull();
    expect(swipeDirection(80, 120)).toBeNull();
    expect(swipeDirection(-80, 10)).toBe("left");
    expect(swipeDirection(80, 10)).toBe("right");
  });

  it("moves focus into the dialog, traps Tab, locks scroll and restores focus on close", () => {
    renderWithIntl(<Harness start={-1} />);
    const opener = screen.getByRole("button", { name: "opener" });
    opener.focus();
    fireEvent.click(opener);
    const close = screen.getByRole("button", { name: "Close image viewer" });
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");

    const next = screen.getByRole("button", { name: "Next image" });
    next.focus();
    fireEvent.keyDown(next, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(next).toHaveFocus();

    fireEvent.keyDown(next, { key: "Escape" });
    expect(document.body.style.overflow).toBe("");
    expect(opener).toHaveFocus();
  });
});
