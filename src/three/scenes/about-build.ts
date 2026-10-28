import * as THREE from "three";
import { legacyIntensity, legacyPointFactor } from "../light-compat";
import type { SceneFactory } from "../scene-types";

const START_ROT = -0.35;
/** The build takes this long (design: 8800 ms): 80% for the eight steps, 20% for the evening light. */
const BUILD_SECONDS = 8.8;
export const AB_STEP_EVENT = "ab-step";
/** B1-10: matches the design lamp (distance 7, decay 2) at 20% of its range instead of 40%, so nearby surfaces are not blown out. */
const LAMP_REF = 0.2;

const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

/**
 * About page: reception and boardroom assembled step by step (design `initAb3d`): eight groups descend into place in
 * order, then warm evening light fades in. Drag, touch or arrow keys turn it (Home resets). The current step is announced
 * by a bubbling `ab-step` CustomEvent on the canvas (`detail` = 0..7) so the page can show its caption.
 * Tone mapping is the scene root default (ACES, exposure 1), the same as the design's renderer (B1-11: nothing to pass).
 * Reduced motion (BR-001): the finished build with evening light is drawn at once, and the view turns only when asked.
 */
const aboutBuild: SceneFactory = (ctx) => {
  const { scene, camera, canvas, quality, invalidate } = ctx;
  const { M, K } = ctx.createKit();
  const { B: Bk, mk, box: boxGeo, at } = K;
  const P = Math.PI;
  const H = Math.PI / 2;
  const Y = 0.08;

  const hemi = new THREE.HemisphereLight(0xeaf1fa, 0x3a2a1c, legacyIntensity(0.85));
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1de, legacyIntensity(1.15));
  sun.position.set(8, 12, 6);
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  const lampK = legacyPointFactor(7, 2, LAMP_REF);
  const warm = (
    [
      [-2.2, 2.2, 0.6],
      [2.5, 2.2, -1.45],
      [2.6, 2.0, 2.2],
    ] as const
  ).map(([x, y, z]) => {
    const l = new THREE.PointLight(0xffb86e, 0, 7, 2);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  });

  const g = new THREE.Group();
  scene.add(g);
  const steps: THREE.Object3D[][] = [];
  let step = 0;
  const reg = <T extends THREE.Object3D>(o: T) => {
    o.userData.base = o.position.y;
    (steps[step] ??= []).push(o);
    g.add(o);
    return o;
  };
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => reg(mk(boxGeo(w, h, d), m, x, y, z));
  const put = (o: THREE.Object3D, x: number, y: number, z: number, ry: number) => reg(at(o, x, Y + y, z, ry));

  step = 0; // floor
  const slab = new THREE.MeshStandardMaterial({ color: 0x55595f, roughness: 1 });
  ctx.own(() => slab.dispose());
  box(9.2, 0.5, 7.2, slab, 0, -0.25, 0);
  box(9, 0.08, 7, M.floor, 0, 0.04, 0);
  step = 1; // walls and glazing
  box(9, 3, 0.18, M.wall, 0, 1.5, -3.5);
  box(0.18, 1, 7, M.wall, -4.5, 0.5, 0);
  box(0.18, 0.5, 7, M.wall, -4.5, 2.75, 0);
  for (let z = -3; z <= 3; z += 1.5) box(0.2, 1.5, 0.08, M.metal, -4.5, 1.75, z);
  const win = mk(boxGeo(0.04, 1.5, 7), M.glass, -4.45, 1.75, 0);
  win.castShadow = false;
  reg(win);
  step = 2; // reception counter
  put(Bk.reception({ w: 2.6 }), -2.2, 0, 0.7, 0);
  put(Bk.taskChair({ fab: M.fabNavy }), -2.2, 0, -0.25, 0);
  put(Bk.monitor({ w: 0.5 }), -2.6, 0.755, 0.2, P);
  step = 3; // brand wall
  put(Bk.logoWall({ w: 2.6, h: 1.3, onLoad: invalidate }), -2.2, 1.7, -3.39, 0);
  step = 4; // waiting area
  put(Bk.bench({ w: 1.6 }), -4.05, 0, 1.6, H);
  put(Bk.plant({ h: 1.6 }), -4.0, 0, -2.9, 0);
  put(Bk.plant({ h: 1.3 }), -0.5, 0, 3.0, 0);
  step = 5; // boardroom glass
  put(Bk.glass({ w: 4.0, h: 2.7 }), 2.45, 0, 0.6, 0);
  put(Bk.glass({ w: 4.1, h: 2.7 }), 0.4, 0, -1.45, H);
  step = 6; // meeting table, chairs, screen
  put(Bk.confTable({ l: 2.6, w: 1.1 }), 2.5, 0, -1.45, H);
  [-2.3, -1.45, -0.6].forEach((z) => {
    put(Bk.confChair({ fab: M.fabNavy }), 1.6, 0, z, H);
    put(Bk.confChair({ fab: M.fabNavy }), 3.4, 0, z, -H);
  });
  put(Bk.tv({ w: 1.6 }), 2.5, 1.55, -3.38, 0);
  put(Bk.credenza({ w: 1.6, walnut: true }), 4.15, 0, -1.45, -H);
  put(Bk.plant({ h: 1.4 }), 4.1, 0, 0.15, 0);
  step = 7; // informal seating
  put(Bk.rug({ w: 2.6, d: 1.9, m: M.rug }), 2.6, 0, 2.2, 0);
  put(Bk.sofa({ n: 2, fab: M.fabSand }), 2.6, 0, 3.0, P);
  put(Bk.coffee({ r: 0.38 }), 2.6, 0, 2.0, 0);
  put(Bk.sofa({ n: 1, fab: M.fabNavy }), 1.15, 0, 1.95, H);

  const dir = new THREE.Vector3(1, 0.92, 1).normalize();
  const tgt = new THREE.Vector3(0, 0.9, 0);
  let dist = 18;
  let target = START_ROT;
  let cur = START_ROT;
  let vel = 0;
  let drag: { x: number; r: number; id: number; moved: boolean } | null = null;
  let elapsed = 0;
  let smooth: number | null = null;
  let shown = -1;
  const still = ctx.reducedMotion;

  const place = () => {
    g.rotation.y = cur;
    camera.position.copy(tgt).addScaledVector(dir, dist);
    camera.lookAt(tgt);
  };
  const fit = (w: number, h: number) => {
    camera.aspect = w / h;
    const R = 5.7; // design: 5.0, which crops the corners of the cutaway at this aspect
    const vf = (camera.fov * Math.PI) / 360;
    const hf = Math.atan(Math.tan(vf) * camera.aspect);
    dist = Math.max(R / Math.sin(vf), R / Math.sin(hf));
    camera.updateProjectionMatrix();
    place();
    invalidate();
  };

  /** p: build progress 0..1. */
  const apply = (p: number) => {
    const b = Math.min(1, p / 0.8) * 8;
    steps.forEach((list, s) => {
      list.forEach((o, j) => {
        const q = ease((b - s - j * 0.04) / 0.85);
        o.visible = q > 0.001 || s === 0;
        o.position.y = (o.userData.base as number) + (s === 0 ? 0 : (1 - q) * 3.4);
      });
    });
    const cs = Math.min(7, Math.floor(b));
    if (cs !== shown) {
      shown = cs;
      canvas.dispatchEvent(new CustomEvent(AB_STEP_EVENT, { detail: cs, bubbles: true }));
    }
    const eve = Math.min(1, Math.max(0, (p - 0.8) / 0.2));
    warm.forEach((l) => (l.intensity = eve * 2.2 * lampK));
    sun.intensity = legacyIntensity(1.15 - 0.55 * eve);
    hemi.intensity = legacyIntensity(0.85 - 0.3 * eve);
  };

  const s = ctx.size();
  fit(s.width || 600, s.height || 500);

  canvas.tabIndex = 0;
  canvas.style.cursor = "grab";
  canvas.style.touchAction = "pan-y";
  const turn = (to: number) => {
    target = to;
    if (still) {
      cur = to;
      place();
    }
    invalidate();
  };
  const down = (e: PointerEvent) => {
    drag = { x: e.clientX, r: target, id: e.pointerId, moved: false };
    vel = 0;
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) {
      drag.moved = true;
      canvas.style.cursor = "grabbing";
      try {
        canvas.setPointerCapture(drag.id);
      } catch {}
    }
    if (drag.moved) {
      const nr = drag.r + dx * 0.01;
      vel = nr - target;
      turn(nr);
    }
  };
  const up = () => {
    drag = null;
    canvas.style.cursor = "grab";
    if (still) vel = 0;
  };
  const key = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      vel = 0;
      turn(target + (e.key === "ArrowLeft" ? -0.2 : 0.2));
    } else if (e.key === "Home") {
      e.preventDefault();
      vel = 0;
      turn(START_ROT);
    }
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("keydown", key);
  ctx.own(() => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
    canvas.removeEventListener("keydown", key);
  });

  apply(still ? 1 : 0);
  place();
  return {
    frame(dt) {
      if (still) return;
      elapsed += dt;
      const p = Math.min(1, elapsed / BUILD_SECONDS);
      smooth = smooth == null ? p : smooth + (p - smooth) * 0.12;
      apply(smooth);
      if (!drag) {
        vel *= 0.92;
        target += vel;
      }
      cur += (target - cur) * 0.18;
      place();
    },
    resize: fit,
  };
};

export default aboutBuild;
