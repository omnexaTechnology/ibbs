import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HotspotImage, hotspotStyle, mirrorX, tipSide } from "./hotspot";

const spots = [
  { x: 20, y: 30, tag: "Desk", title: "Walnut desk", desc: "Solid walnut" },
  { x: 80, y: 60, title: "Chair" },
];

describe("hotspot maths (BR-002, F-09)", () => {
  it("mirrors x as 100 - x in RTL and leaves it alone in LTR", () => {
    expect(mirrorX(20, "ltr")).toBe(20);
    expect(mirrorX(20, "rtl")).toBe(80);
    expect(mirrorX(50, "rtl")).toBe(50);
    expect(mirrorX(0, "rtl")).toBe(100);
  });

  it("never touches y", () => {
    expect(hotspotStyle({ x: 10, y: 35 }, "rtl")).toEqual({ left: "90%", top: "35%" });
    expect(hotspotStyle({ x: 10, y: 35 }, "ltr")).toEqual({ left: "10%", top: "35%" });
  });

  it("opens the tooltip toward the middle (design threshold x > 55)", () => {
    expect(tipSide(55)).toBe("r");
    expect(tipSide(56)).toBe("l");
    expect(tipSide(10)).toBe("r");
  });
});

describe("<HotspotImage>", () => {
  it("keeps the cropped image ratio on its box and places pins in percent of that box", () => {
    render(
      <HotspotImage aspect={16 / 10} hotspots={spots}>
        <div />
      </HotspotImage>,
    );
    expect(screen.getByTestId("hotspot-image").style.aspectRatio).toBe("1.6 / 1");
    const pins = screen.getAllByTestId("hotspot");
    expect(pins[0].style.left).toBe("20%");
    expect(pins[0].style.top).toBe("30%");
    expect(pins[1].style.left).toBe("80%");
    expect(pins[1]).toHaveAttribute("data-side", "l");
  });

  it("RTL alone (dir) does not move the pins or flip the image", () => {
    render(
      <HotspotImage aspect={1.5} hotspots={spots} dir="rtl">
        <div />
      </HotspotImage>,
    );
    expect(screen.getAllByTestId("hotspot")[0].style.left).toBe("20%");
    expect(screen.queryByTestId("hotspot-mirror")).toBeNull();
  });

  it("mirror flips the image and the pins together and flips the tooltip side", () => {
    render(
      <HotspotImage aspect={1.5} hotspots={spots} dir="rtl" mirror>
        <div />
      </HotspotImage>,
    );
    const pins = screen.getAllByTestId("hotspot");
    expect(pins[0].style.left).toBe("80%");
    expect(pins[0]).toHaveAttribute("data-side", "l");
    expect(pins[1].style.left).toBe("20%");
    expect(pins[1]).toHaveAttribute("data-side", "r");
    expect(screen.getAllByRole("tooltip", { hidden: true })[0]).toHaveAttribute("dir", "rtl");
    expect(screen.getByTestId("hotspot-mirror").className).toContain("-scale-x-100");
  });

  it("gives every instance its own tooltip ids (B1-05)", () => {
    render(
      <>
        <HotspotImage aspect={1} hotspots={spots}>
          <div />
        </HotspotImage>
        <HotspotImage aspect={1} hotspots={spots}>
          <div />
        </HotspotImage>
      </>,
    );
    const ids = screen.getAllByRole("tooltip", { hidden: true }).map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("makes each pin a focusable button described by its tooltip (keyboard access)", () => {
    render(
      <HotspotImage aspect={1.5} hotspots={spots}>
        <div />
      </HotspotImage>,
    );
    const btn = screen.getByRole("button", { name: "Walnut desk" });
    expect(btn.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(btn.getAttribute("aria-describedby")!)).toHaveTextContent("Solid walnut");
    btn.focus();
    expect(btn).toHaveFocus();
  });
});
