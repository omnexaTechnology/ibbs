import * as THREE from "three";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createKit } from "../kit";
import { createMaterials } from "../materials";
import type { SceneContext, SceneHandle } from "../scene-types";
import aboutBuild from "./about-build";

beforeAll(() => {
  const c2d = new Proxy({}, { get: () => () => {}, set: () => true });
  HTMLCanvasElement.prototype.getContext = (() => c2d) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

function ctxFor(reducedMotion: boolean) {
  const canvas = document.createElement("canvas");
  const M = createMaterials();
  const K = createKit(M);
  const own: (() => void)[] = [];
  const ctx = {
    canvas,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(28, 1, 0.1, 120),
    quality: { dprCap: 1, shadows: false, lowEnd: true },
    reducedMotion,
    size: () => ({ width: 800, height: 700 }),
    invalidate: vi.fn(),
    own: (fn: () => void) => own.push(fn),
    createKit: () => ({ M, K }),
  } as unknown as SceneContext;
  const steps: number[] = [];
  canvas.addEventListener("ab-step", (e) => steps.push((e as CustomEvent<number>).detail));
  return { ctx, canvas, own, steps };
}

const lamps = (ctx: SceneContext) => ctx.scene.children.filter((c): c is THREE.PointLight => c.type === "PointLight");
const run = (h: SceneHandle, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) h.frame?.(1 / 60, 0);
};

describe("about build scene", () => {
  it("starts with only the floor, builds through the 8 steps, then lights the lamps (B1-10: far less than the 14x hot spot)", async () => {
    const { ctx, steps } = ctxFor(false);
    const h = (await aboutBuild(ctx)) as SceneHandle;
    const group = ctx.scene.children.find((c) => c.type === "Group") as THREE.Group;
    expect(group.children.filter((c) => c.visible).length).toBeLessThan(group.children.length / 4);
    expect(lamps(ctx).every((l) => l.intensity === 0)).toBe(true);
    run(h, 12);
    expect(group.children.every((c) => c.visible)).toBe(true);
    expect(steps[0]).toBe(0);
    expect(steps.at(-1)).toBe(7);
    const k = lamps(ctx)[0].intensity / 2.2;
    expect(k).toBeGreaterThan(Math.PI); // brighter than the plain PI scale...
    expect(k).toBeLessThan(5); // ...but nowhere near the 40%-reference factor (about 14x hot spot at 0.5 m)
  });

  it("BR-001: reduced motion draws the finished build with evening light at once and still turns on input", async () => {
    const { ctx, canvas, own } = ctxFor(true);
    const h = (await aboutBuild(ctx)) as SceneHandle;
    const group = ctx.scene.children.find((c) => c.type === "Group") as THREE.Group;
    expect(group.children.every((c) => c.visible)).toBe(true);
    expect(lamps(ctx)[0].intensity).toBeGreaterThan(0);
    run(h, 1);
    canvas.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(group.rotation.y).toBeCloseTo(-0.15, 5);
    own.forEach((fn) => fn());
    canvas.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(group.rotation.y).toBeCloseTo(-0.15, 5);
  });
});
