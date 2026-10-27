import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type HotspotData = {
  /** Position in percent of the (cropped) image, measured as in the LTR design. */
  x: number;
  y: number;
  tag?: string;
  title: string;
  desc?: string;
};

export type Direction = "ltr" | "rtl";

/** BR-002: positions are authored for LTR; in RTL the image is mirrored, so x becomes `100 - x`. */
export function mirrorX(x: number, dir: Direction): number {
  return dir === "rtl" ? 100 - x : x;
}

/** The tooltip opens toward the middle of the image: left of the pin when it sits in the right part (design: x > 55). */
export function tipSide(displayX: number): "l" | "r" {
  return displayX > 55 ? "l" : "r";
}

export function hotspotStyle(h: Pick<HotspotData, "x" | "y">, dir: Direction): CSSProperties {
  return { left: `${mirrorX(h.x, dir)}%`, top: `${h.y}%` };
}

type Props = {
  /**
   * Width / height of the image AS CROPPED (F-09). The box takes exactly this ratio, so a pin at 40% / 60%
   * lands on the same detail of the picture at every viewport. Never use an `object-fit: cover` box of a
   * different ratio for pins.
   */
  aspect: number;
  hotspots: HotspotData[];
  dir?: Direction;
  /** The image element, filling the box (e.g. `<Image fill className="object-cover" ... />`). */
  children: ReactNode;
  className?: string;
};

/** Image with pulsing pins that open a glass tooltip on hover or keyboard focus. */
export function HotspotImage({ aspect, hotspots, dir = "ltr", children, className }: Props) {
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ aspectRatio: String(aspect) }} data-testid="hotspot-image">
      {children}
      <div className="ui-hs-layer">
        {hotspots.map((h, i) => {
          const x = mirrorX(h.x, dir);
          const id = `hs-tip-${i}`;
          return (
            <div key={`${h.x}-${h.y}-${i}`} className="ui-hs" style={hotspotStyle(h, dir)} data-testid="hotspot" data-x={x} data-side={tipSide(x)}>
              <button type="button" className="ui-hs-btn" aria-label={h.title} aria-describedby={id}>
                <span className="core" />
              </button>
              <div id={id} role="tooltip" dir={dir} className={cn("ui-tip", tipSide(x))}>
                {h.tag ? <span className="k">{h.tag}</span> : null}
                <b>{h.title}</b>
                {h.desc ? <span>{h.desc}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
