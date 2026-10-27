import * as THREE from "three";
import { legacyIntensity } from "../light-compat";
import type { SceneFactory } from "../scene-types";

const START_ROT = 0.55;

/**
 * Projects page: an open-plan operations floor on a plinth (design `initPj3d`), turned by drag, touch or the arrow keys
 * (Home resets). Tone mapping and exposure are the scene root defaults (ACES, 1.0), the same as the design's renderer.
 * Reduced motion (BR-001): the view still turns on input, but without inertia or smoothing, and only when asked.
 */
const projectsFloor: SceneFactory = (ctx) => {
  const { scene, camera, canvas, quality, invalidate } = ctx;
  const { M, K } = ctx.createKit();
  const { B: Bk, mk, box, at } = K;
  const P = Math.PI;
  const H = Math.PI / 2;
  const Y = 0.08;

  scene.add(new THREE.HemisphereLight(0xeff3fa, 0x46382a, legacyIntensity(0.9)));
  const sun = new THREE.DirectionalLight(0xfff1de, legacyIntensity(1.2));
  sun.position.set(-7, 12, 8);
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
  sun.shadow.bias = -0.0006;
  scene.add(sun);

  const g = new THREE.Group();
  scene.add(g);
  const slab = (w: number, hh: number, d: number, m: THREE.Material, x: number, y: number, z: number) => g.add(mk(box(w, hh, d), m, x, y, z));
  const put = (o: THREE.Object3D, x: number, y: number, z: number, ry: number) => g.add(at(o, x, Y + y, z, ry));

  slab(10.2, 0.4, 7.2, M.panel, 0, -0.2, 0);
  slab(10, 0.08, 7, M.floor, 0, 0.04, 0);
  slab(10, 2.8, 0.16, M.wall, 0, 1.4, -3.5);
  slab(0.16, 2.8, 7, M.wall, -5, 1.4, 0);

  // two benches of four workstations
  [-2.6, 0.4].forEach((cx) => {
    [-0.72, 0.72].forEach((dx) =>
      [-1, 1].forEach((s) => {
        const x = cx + dx;
        const f = s > 0 ? 0 : P;
        put(Bk.desk({ w: 1.4, d: 0.78 }), x, 0, 0.6 + s * 0.4, f);
        put(Bk.taskChair({ fab: s > 0 ? M.fabGrey : M.fabBlue }), x, 0, 0.6 + s * 1.15, s > 0 ? P : 0);
        put(Bk.monitor({ w: 0.6 }), x, 0.75, 0.6 + s * 0.16, f);
      }),
    );
    put(Bk.screen({ w: 2.86 }), cx, 0, 0.6, 0);
  });
  // collaboration table and a glazed focus room with soft seating
  put(Bk.confTable({ l: 2.0, w: 1.0 }), 3.2, 0, 1.6, H);
  ([[2.55, 0.95, H], [2.55, 2.25, H], [3.85, 0.95, -H], [3.85, 2.25, -H]] as const).forEach(([x, z, ry]) => put(Bk.confChair({ fab: M.fabNavy }), x, 0, z, ry));
  put(Bk.glass({ w: 3.0, h: 2.6 }), 3.4, 0, -0.9, 0);
  put(Bk.glass({ w: 2.5, h: 2.6 }), 1.9, 0, -2.2, H);
  put(Bk.sofa({ n: 2, fab: M.fabSand }), 3.5, 0, -2.9, 0);
  put(Bk.coffee({ r: 0.35 }), 3.5, 0, -2.05, 0);
  // storage wall, brand wall, plants
  [-4.2, -3.3, -2.4].forEach((x) => put(Bk.tallCabinet({ w: 0.9 }), x, 0, -3.15, 0));
  put(Bk.logoWall({ w: 2.4, h: 1.2, onLoad: invalidate }), -0.4, 1.7, -3.39, 0);
  put(Bk.acoustic({ w: 1.0, h: 1.2 }), -4.88, 1.6, 1.2, H);
  put(Bk.plant({ h: 1.6 }), -4.4, 0, 2.9, 0);
  put(Bk.plant({ h: 1.4 }), 4.5, 0, 3.0, 0);
  put(Bk.plant({ h: 1.2 }), 1.3, 0, -3.0, 0);

  const dir = new THREE.Vector3(1, 0.95, 1.05).normalize();
  const tgt = new THREE.Vector3(0, 0.7, 0);
  let dist = 20;
  let target = START_ROT;
  let cur = START_ROT;
  let vel = 0;
  let drag: { x: number; r: number; id: number; moved: boolean } | null = null;

  const place = () => {
    g.rotation.y = cur;
    camera.position.copy(tgt).addScaledVector(dir, dist);
    camera.lookAt(tgt);
  };
  const fit = (w: number, h: number) => {
    camera.aspect = w / h;
    const R = 6.3;
    const vf = (camera.fov * Math.PI) / 360;
    const hf = Math.atan(Math.tan(vf) * camera.aspect);
    dist = Math.max(R / Math.sin(vf), R / Math.sin(hf));
    camera.updateProjectionMatrix();
    place();
    invalidate();
  };
  const s = ctx.size();
  fit(s.width || 600, s.height || 500);

  canvas.tabIndex = 0;
  canvas.style.cursor = "grab";
  const still = ctx.reducedMotion;
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
      const nr = drag.r + dx * 0.008;
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

  place();
  return {
    frame() {
      if (still) return;
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

export default projectsFloor;
