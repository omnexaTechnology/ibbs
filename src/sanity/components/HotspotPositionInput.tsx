"use client";

import imageUrlBuilder from "@sanity/image-url";
import type { MouseEvent } from "react";
import { set, useClient, useFormValue, type ObjectInputProps } from "sanity";
import { apiVersion } from "../env";
import { clickToPercent } from "./hotspot-position";

/**
 * Object input for `imageHotspot`: shows the project's cover photo; clicking it sets x/y.
 * The number fields stay available underneath for fine tuning.
 */
export function HotspotPositionInput(props: ObjectInputProps) {
  const client = useClient({ apiVersion });
  const cover = useFormValue(["cover"]) as { asset?: { _ref?: string } } | undefined;
  const value = props.value as { x?: number; y?: number } | undefined;

  const hasCover = Boolean(cover?.asset?._ref);
  const src = hasCover ? imageUrlBuilder(client).image(cover as never).width(900).url() : null;

  const onPick = (event: MouseEvent<HTMLDivElement>) => {
    const point = clickToPercent(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
    if (!point) return;
    props.onChange([set(point.x, ["x"]), set(point.y, ["y"])]);
  };

  return (
    <div>
      {src ? (
        <div
          onClick={onPick}
          style={{ position: "relative", cursor: "crosshair", maxWidth: 560, marginBottom: 12, lineHeight: 0 }}
          title="Click to place the point"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Studio UI, not part of the site */}
          <img src={src} alt="Cover photo: click to place the point" style={{ width: "100%", borderRadius: 4 }} draggable={false} />
          {typeof value?.x === "number" && typeof value?.y === "number" ? (
            <span
              style={{
                position: "absolute",
                left: `${value.x}%`,
                top: `${value.y}%`,
                width: 18,
                height: 18,
                marginLeft: -9,
                marginTop: -9,
                borderRadius: "50%",
                background: "#2563eb",
                border: "2px solid #fff",
                boxShadow: "0 0 0 2px rgba(37,99,235,.4)",
                pointerEvents: "none",
              }}
            />
          ) : null}
        </div>
      ) : (
        <p style={{ fontSize: 13, opacity: 0.7 }}>Upload the cover photo first, then click it here to place the point.</p>
      )}
      {props.renderDefault(props)}
    </div>
  );
}
