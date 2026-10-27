import { useId, type CSSProperties, type ReactNode } from "react";
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

/** BR-002: positions are authored for the unflipped image; when the image is mirrored (RTL hero) x becomes `100 - x`. */
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
  /** Text direction of the tooltips only. Does NOT move the pins (see `mirror`). */
  dir?: Direction;
  /**
   * Flip the image and the pins together (the design's RTL hero does: `scaleX(-1)` + `100 - x`). Default false: images that
   * are not flipped in Arabic (project detail) keep their pins where they were authored. Never mirror pins without the image.
   */
  mirror?: boolean;
  /** The image element, filling the box (e.g. `<Image fill className="object-cover" ... />`). */
  children: ReactNode;
  className?: string;
};

/** Image with pulsing pins that open a glass tooltip on hover or keyboard focus. */
export function HotspotImage({ aspect, hotspots, dir = "ltr", mirror = false, children, className }: Props) {
  const uid = useId();
  const pinDir: Direction = mirror ? "rtl" : "ltr";
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ aspectRatio: String(aspect) }} data-testid="hotspot-image">
      {mirror ? (
        <div className="absolute inset-0 -scale-x-100" data-testid="hotspot-mirror">
          {children}
        </div>
      ) : (
        children
      )}
      <div className="ui-hs-layer">
        {hotspots.map((h, i) => {
          const x = mirrorX(h.x, pinDir);
          const id = `${uid}-hs-tip-${i}`;
          return (
            <div key={`${h.x}-${h.y}-${i}`} className="ui-hs" style={hotspotStyle(h, pinDir)} data-testid="hotspot" data-x={x} data-side={tipSide(x)}>
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
