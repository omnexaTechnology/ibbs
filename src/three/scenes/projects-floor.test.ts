import * as THREE from "three";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createKit } from "../kit";
import { createMaterials } from "../materials";
import type { SceneContext } from "../scene-types";
import projectsFloor from "./projects-floor";

beforeAll(() => {
  // jsdom has no 2D canvas: give the wood-grain generator a no-op context.
  const c2d = new Proxy({}, { get: () => () => {}, set: () => true });
  HTMLCanvasElement.prototype.getContext = (() => c2d) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

function ctxFor(reducedMotion: boolean) {
  const canvas = document.createElement("canvas");
  const M = createMaterials();
  const K = createKit(M);
  const own: (() => void)[] = [];
  const invalidate = vi.fn();
  const ctx = {
    canvas,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(26, 1, 0.1, 120),
    quality: { dprCap: 1, shadows: false, lowEnd: true },
    reducedMotion,
    size: () => ({ width: 800, height: 500 }),
    invalidate,
    own: (fn: () => void) => own.push(fn),
    createKit: () => ({ M, K }),
  } as unknown as SceneContext;
  return { ctx, canvas, invalidate, own };
}

const spin = (h: { frame: (dt: number, t: number) => void }) => {
  for (let i = 0; i < 80; i++) h.frame(0.016, 0);
};

describe("projects floor scene", () => {
  it("builds the floor, is keyboard focusable and turns with the arrow keys; Home resets", async () => {
    const { ctx, canvas, invalidate } = ctxFor(false);
    const handle = (await projectsFloor(ctx)) as { frame: (dt: number, t: number) => void };
    const group = ctx.scene.children.find((c) => c.type === "Group") as THREE.Group;
    expect(group.children.length).toBeGreaterThan(30);
    expect(canvas.tabIndex).toBe(0);
    spin(handle);
    expect(group.rotation.y).toBeCloseTo(0.55, 2);
    canvas.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    spin(handle);
    expect(group.rotation.y).toBeCloseTo(0.75, 2);
    canvas.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    spin(handle);
    expect(group.rotation.y).toBeCloseTo(0.55, 2);
    expect(invalidate).toHaveBeenCalled();
  });

  it("BR-001: under reduced motion the view turns on input without a frame loop, and listeners go away on dispose", async () => {
    const { ctx, canvas, own } = ctxFor(true);
    await projectsFloor(ctx);
    const group = ctx.scene.children.find((c) => c.type === "Group") as THREE.Group;
    canvas.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(group.rotation.y).toBeCloseTo(0.35, 5);
    own.forEach((fn) => fn());
    canvas.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(group.rotation.y).toBeCloseTo(0.35, 5);
  });
});
