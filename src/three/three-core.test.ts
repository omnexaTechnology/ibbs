import * as THREE from "three";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DisposeBag, disposeMaterials, disposeScene } from "./dispose";
import { createKit } from "./kit";
import { legacyIntensity, legacyPointFactor } from "./light-compat";
import { MAX_DT, RenderLoop } from "./loop";
import { createMaterials } from "./materials";
import { qualityFor } from "./renderer";
import { walkLayout, layoutBuilder } from "./walk-layout";

beforeAll(() => {
  // jsdom has no 2D canvas: give the wood-grain generator a no-op context.
  const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
  HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe("disposeScene bookkeeping", () => {
  it("disposes each geometry, material and texture once, including shared ones", () => {
    const geo = new THREE.BoxGeometry();
    const tex = new THREE.Texture();
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex });
    const geoSpy = vi.spyOn(geo, "dispose");
    const texSpy = vi.spyOn(tex, "dispose");
    const matSpy = vi.spyOn(mat, "dispose");
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geo, mat), new THREE.Mesh(geo, mat));
    const stats = disposeScene(scene);
    expect(stats).toEqual({ geometries: 1, materials: 1, textures: 1 });
    expect(geoSpy).toHaveBeenCalledTimes(1);
    expect(texSpy).toHaveBeenCalledTimes(1);
    expect(matSpy).toHaveBeenCalledTimes(1);
  });

  it("handles material arrays and the scene background texture", () => {
    const bg = new THREE.Texture();
    const bgSpy = vi.spyOn(bg, "dispose");
    const scene = new THREE.Scene();
    scene.background = bg;
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(), [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial()]));
    const stats = disposeScene(scene);
    expect(stats.materials).toBe(2);
    expect(bgSpy).toHaveBeenCalled();
  });

  it("disposes a full material set, even materials not attached to a mesh", () => {
    const M = createMaterials();
    const stats = disposeMaterials(M as unknown as Record<string, THREE.Material>);
    expect(stats.materials).toBeGreaterThan(30);
    expect(stats.textures).toBe(3); // oak, walnut, floor
  });

  it("DisposeBag runs callbacks last-in-first-out once and survives a throwing one", () => {
    const order: number[] = [];
    const bag = new DisposeBag();
    bag.add(() => order.push(1));
    bag.add(() => {
      throw new Error("boom");
    });
    bag.add(() => order.push(3));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    bag.disposeAll();
    bag.disposeAll();
    err.mockRestore();
    expect(order).toEqual([3, 1]);
    // adding after disposal runs immediately
    bag.add(() => order.push(9));
    expect(order).toEqual([3, 1, 9]);
  });
});

describe("kit", () => {
  it("builds every piece and the walk-through layout without throwing; pieces carry info", () => {
    const M = createMaterials();
    const K = createKit(M);
    const types = new Set<string>();
    for (const it of walkLayout()) {
      const b = K.B[layoutBuilder(it.t)];
      expect(b, it.t).toBeTypeOf("function");
      const g = b({ ...it.o, fab: it.o.fab ? M[it.o.fab] : undefined });
      expect(g.children.length).toBeGreaterThan(0);
      if (g.userData.type) expect(g.userData.info).toBeDefined();
      types.add(g.userData.type as string);
    }
    expect(types.has("execDesk") && types.has("reception") && types.has("plant")).toBe(true);
    K.dispose();
  });

  it("dispose frees cached geometries", () => {
    const K = createKit(createMaterials());
    const g = K.B.desk();
    const geo = (g.children[0] as THREE.Mesh).geometry;
    const spy = vi.spyOn(geo, "dispose");
    K.dispose();
    expect(spy).toHaveBeenCalled();
  });
});

describe("quality (R1)", () => {
  it("caps DPR at 2 on desktop and 1.5 on touch, with shadows", () => {
    expect(qualityFor({ coarsePointer: false })).toEqual({ dprCap: 2, shadows: true, lowEnd: false });
    expect(qualityFor({ coarsePointer: true, deviceMemory: 8, hardwareConcurrency: 8 })).toEqual({ dprCap: 1.5, shadows: true, lowEnd: false });
  });
  it("low-end devices get DPR 1 and no shadows", () => {
    expect(qualityFor({ coarsePointer: false, deviceMemory: 4 })).toEqual({ dprCap: 1, shadows: false, lowEnd: true });
    expect(qualityFor({ coarsePointer: true, hardwareConcurrency: 4 }).shadows).toBe(false);
  });
});

describe("light compatibility (r149 -> r186)", () => {
  it("scales directional/ambient intensities by PI", () => {
    expect(legacyIntensity(1)).toBeCloseTo(Math.PI);
  });
  it("matches the old falloff at the reference distance", () => {
    const distance = 7;
    const decay = 2;
    const f = legacyPointFactor(distance, decay);
    const d0 = 0.4 * distance;
    const oldE = Math.PI * Math.pow(1 - d0 / distance, decay);
    const newE = f * (1 / Math.pow(d0, decay)) * Math.pow(1 - Math.pow(d0 / distance, 4), 2);
    expect(newE).toBeCloseTo(oldE, 6);
  });
});

describe("RenderLoop", () => {
  const harness = () => {
    let id = 0;
    let t = 0;
    const cbs = new Map<number, FrameRequestCallback>();
    const render = vi.fn();
    const loop = new RenderLoop({
      render,
      raf: (cb) => {
        cbs.set(++id, cb);
        return id;
      },
      caf: (i) => void cbs.delete(i),
      now: () => t,
    });
    const frame = (ms = 16) => {
      t += ms;
      const all = [...cbs.entries()];
      cbs.clear();
      all.forEach(([, cb]) => cb(t));
    };
    return { loop, render, frame, pending: () => cbs.size };
  };

  it("draws continuously while visible", () => {
    const h = harness();
    h.loop.start();
    h.frame();
    h.frame();
    expect(h.render).toHaveBeenCalledTimes(2);
    expect(h.pending()).toBe(1);
  });

  it("pauses off-screen and resumes when visible again", () => {
    const h = harness();
    h.loop.start();
    h.frame();
    h.loop.setVisible(false);
    expect(h.pending()).toBe(0);
    h.frame();
    expect(h.render).toHaveBeenCalledTimes(1);
    h.loop.setVisible(true);
    h.frame();
    expect(h.render).toHaveBeenCalledTimes(2);
  });

  it("pauses in a hidden tab", () => {
    const h = harness();
    h.loop.start();
    h.loop.setTabHidden(true);
    expect(h.pending()).toBe(0);
    h.loop.setTabHidden(false);
    expect(h.pending()).toBe(1);
  });

  it("clamps the time step after a long pause", () => {
    const h = harness();
    h.loop.start();
    h.frame(5000);
    expect(h.render.mock.calls[0][0]).toBe(MAX_DT);
  });

  it("dispose cancels the pending frame and never draws again", () => {
    const h = harness();
    h.loop.start();
    h.loop.dispose();
    expect(h.pending()).toBe(0);
    h.loop.setVisible(true);
    h.loop.invalidate();
    h.frame();
    expect(h.render).not.toHaveBeenCalled();
  });

  it("BR-001 on-demand mode draws only when asked", () => {
    let t = 0;
    const cbs: FrameRequestCallback[] = [];
    const render = vi.fn();
    const loop = new RenderLoop({ render, mode: "on-demand", raf: (cb) => cbs.push(cb), caf: () => {}, now: () => t });
    loop.start();
    t = 16;
    cbs.splice(0).forEach((cb) => cb(t));
    expect(render).toHaveBeenCalledTimes(1);
    expect(cbs).toHaveLength(0);
    loop.invalidate();
    cbs.splice(0).forEach((cb) => cb(32));
    expect(render).toHaveBeenCalledTimes(2);
    expect(cbs).toHaveLength(0);
  });
});

afterEach(() => vi.restoreAllMocks());
