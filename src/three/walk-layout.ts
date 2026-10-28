import type { BuilderName } from "./kit";
import type { MaterialName } from "./materials";

/**
 * Walk-through floor plan (18 m x 14 m, ceiling 3 m): one source for the 3D build, the collision boxes and the
 * text alternative. Ported from the design's `IBSS3D.walkLayout`. Fabrics are material names, resolved by the scene.
 */
export type LayoutOptions = { w?: number; d?: number; h?: number; l?: number; r?: number; n?: number; drop?: number; walnut?: boolean; fab?: MaterialName };
/** Layout item type: a builder name, or `lounge` (a one-seat `sofa`, listed separately in the text alternative). */
export type LayoutType = BuilderName | "lounge";
export type LayoutItem = { zone: string; t: LayoutType; p: [number, number, number]; r: number; o: LayoutOptions };

export const CEIL = 3.0;

/** The kit builder that makes a layout item. */
export const layoutBuilder = (t: LayoutType): BuilderName => (t === "lounge" ? "sofa" : t);

export function walkLayout(): LayoutItem[] {
  const L: LayoutItem[] = [];
  const P = Math.PI;
  const H = Math.PI / 2;
  const add = (zone: string, t: LayoutType, x: number, y: number, z: number, r?: number, o?: LayoutOptions) => L.push({ zone, t, p: [x, y, z], r: r || 0, o: o || {} });

  // reception
  add("reception", "reception", -6.4, 0, 3.5, 0, { w: 3.0 });
  add("reception", "taskChair", -6.4, 0, 2.55, 0, { fab: "fabNavy" });
  add("reception", "monitor", -6.9, 0.755, 3.05, P, { w: 0.5 });
  add("reception", "logoWall", -6.4, 1.65, 1.95, 0, { w: 3.0, h: 1.5 });
  add("reception", "sofa", -8.35, 0, 5.4, H, { n: 3 });
  add("reception", "coffee", -7.25, 0, 5.4, 0, { r: 0.45 });
  add("reception", "lounge", -7.2, 0, 6.55, P, { n: 1, fab: "fabNavy" });
  add("reception", "plant", -8.45, 0, 6.6, 0, { h: 1.7 });
  add("reception", "plant", -8.45, 0, 3.0, 0, { h: 1.4 });
  // open workstations: two benches of four desks
  [0.4, 3.6].forEach((cx) => {
    [-0.72, 0.72].forEach((dx) =>
      [-1, 1].forEach((s) => {
        const x = cx + dx;
        const z0 = 3.9;
        const f = s > 0 ? 0 : P;
        add("work", "desk", x, 0, z0 + s * 0.4, f, { w: 1.4, d: 0.78 });
        add("work", "taskChair", x, 0, z0 + s * 1.15, s > 0 ? P : 0, { fab: s > 0 ? "fabGrey" : "fabBlue" });
        add("work", "monitor", x, 0.75, z0 + s * 0.16, f, { w: 0.6 });
        add("work", "keyboard", x, 0.75, z0 + s * 0.52, f);
        add("work", "pedestal", x + 0.42, 0, z0 + s * 0.5, f);
      }),
    );
    add("work", "screen", cx, 0, 3.9, 0, { w: 2.86 });
    add("work", "linear", cx, CEIL - 0.65, 3.9, 0, { l: 2.6, drop: 0.65 });
  });
  [-0.2, 0.75, 1.7, 2.65].forEach((x) => add("storage", "tallCabinet", x, 0, 6.75, P, { w: 0.9 }));
  add("work", "plant", 5.0, 0, 6.6, 0, { h: 1.6 });
  // lounge by the windows
  add("lounge", "rug", 7.2, 0, 4.0, 0, { w: 3.0, d: 2.6 });
  add("lounge", "sofa", 8.4, 0, 4.0, -H, { n: 3, fab: "fabWarm" });
  add("lounge", "lounge", 6.0, 0, 3.15, H, { n: 1, fab: "fabNavy" });
  add("lounge", "lounge", 6.0, 0, 4.85, H, { n: 1, fab: "fabNavy" });
  add("lounge", "coffee", 7.2, 0, 4.0, 0, { r: 0.5 });
  add("lounge", "floorLamp", 8.5, 0, 2.2);
  add("lounge", "plant", 8.5, 0, 1.3, 0, { h: 1.8 });
  add("lounge", "plant", 8.5, 0, 6.6, 0, { h: 1.5 });
  add("lounge", "dome", 7.2, CEIL - 0.85, 4.0, 0, { drop: 0.61 });
  // meeting room behind glass
  add("meeting", "glass", -5.25, 0, -0.5, 0, { w: 7.5, h: CEIL });
  add("meeting", "glass", -1.5, 0, -4.8, H, { w: 4.4, h: CEIL });
  add("meeting", "glass", -1.5, 0, -0.95, H, { w: 0.9, h: CEIL });
  add("meeting", "confTable", -5.4, 0, -3.9, 0, { l: 3.4, w: 1.2 });
  [-6.6, -5.4, -4.2].forEach((x) => {
    add("meeting", "confChair", x, 0, -4.85, 0);
    add("meeting", "confChair", x, 0, -2.95, P);
  });
  add("meeting", "confChair", -7.55, 0, -3.9, H);
  add("meeting", "confChair", -3.25, 0, -3.9, -H);
  add("meeting", "credenza", -5.4, 0, -6.72, 0, { w: 2.4, walnut: true });
  add("meeting", "tv", -5.4, 1.62, -6.88, 0, { w: 2.0 });
  add("meeting", "linear", -5.4, CEIL - 0.65, -3.9, 0, { l: 2.6, drop: 0.65 });
  add("meeting", "acoustic", -8.86, 1.6, -2.6, H, { w: 1.2, h: 1.4 });
  add("meeting", "acoustic", -8.86, 1.6, -5.2, H, { w: 1.2, h: 1.4 });
  add("meeting", "plant", -8.4, 0, -6.45, 0, { h: 1.5 });
  // executive office behind glass
  add("exec", "glass", 5.25, 0, -1.5, 0, { w: 7.5, h: CEIL });
  add("exec", "glass", 1.5, 0, -4.95, H, { w: 4.1, h: CEIL });
  add("exec", "glass", 1.5, 0, -1.7, H, { w: 0.4, h: CEIL });
  add("exec", "execDesk", 5.8, 0, -5.0, P, { w: 2.0, d: 0.9 });
  add("exec", "execChair", 5.8, 0, -5.85, 0);
  add("exec", "monitor", 5.45, 0.775, -4.75, P, { w: 0.6 });
  add("exec", "guestChair", 5.3, 0, -3.85, P);
  add("exec", "guestChair", 6.3, 0, -3.85, P);
  add("exec", "credenza", 5.8, 0, -6.72, 0, { w: 2.4, walnut: true });
  add("exec", "shelving", 3.0, 0, -6.78, 0, { w: 1.6, h: 2.2 });
  add("exec", "plant", 8.5, 0, -6.5, 0, { h: 1.6 });
  add("exec", "dome", 5.8, CEIL - 0.8, -5.0, 0, { drop: 0.56 });
  // corridor storage
  [-0.95, 0, 0.95].forEach((x) => add("storage", "tallCabinet", x, 0, -6.75, 0, { w: 0.9 }));
  return L;
}
