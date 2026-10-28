import * as THREE from "three";
import { legacyIntensity, legacyPointFactor } from "../light-compat";
import { BRAND } from "../materials";
import { emit, listen, P3_RESET, P3_SET, P3_STAGE } from "../scene-events";
import type { SceneFactory } from "../scene-types";


type Part = { base: THREE.Vector3; s0: number; grp: "shell" | "furn"; d: number };
const LIM = 0.85;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (k: number) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
const sm = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};
/** Design lamp: PointLight(0xFFB46A, i, 10, 2). Here decay 0.75 matched at half the range (B1-10). */
const LAMP_K = legacyPointFactor(10, 2, 0.5, 0.75);

/**
 * Design Process (design `initScene` / `buildScene` / `tick`): a furnished executive office that goes from a blueprint plan
 * (Discover) to clay massing (Plan), materials (Furnish) and lighting from sunrise to night (Deliver).
 * The stage follows the scroll through the pinned section; drag / arrow keys turn the model. Reduced motion (BR-001):
 * the stage comes from the tabs only and every value jumps to its final state.
 */
const process: SceneFactory = (ctx) => {
  const { scene, camera, canvas, quality, invalidate } = ctx;
  const section = canvas.closest<HTMLElement>("[data-p3]");
  const rm = ctx.reducedMotion;
  const { M, K } = ctx.createKit();
  const { B: Bk, mk, box, at } = K;
  const P = Math.PI;
  const H = Math.PI / 2;

  const clay = new THREE.MeshStandardMaterial({ color: 0xf3f0ea, roughness: 0.95 });
  const ghost = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const lineMat = new THREE.LineBasicMaterial({ color: 0xbfd8f2, transparent: true, opacity: 0.95 });
  ctx.own(() => [clay, ghost, lineMat].forEach((m) => m.dispose()));
  const meshes: THREE.Mesh[] = [];
  const parts: THREE.Object3D[] = [];
  const baseMat = new Map<THREE.Mesh, THREE.Material>();
  const edges = new Map<THREE.Mesh, THREE.LineSegments>();

  const track = (mesh: THREE.Mesh) => {
    baseMat.set(mesh, mesh.material as THREE.Material);
    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
    if (mesh.geometry.boundingSphere!.radius * mesh.scale.x > 0.12) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 28), lineMat);
      mesh.add(e);
      edges.set(mesh, e);
    }
    meshes.push(mesh);
  };
  const part = <T extends THREE.Object3D>(obj: T, grp: Part["grp"], d = 0): T => {
    obj.userData = { base: obj.position.clone(), s0: obj.scale.x, grp, d } satisfies Part;
    scene.add(obj);
    parts.push(obj);
    obj.traverse((c) => (c as THREE.Mesh).isMesh && track(c as THREE.Mesh));
    return obj;
  };
  const shell = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => part(mk(box(w, h, d), m, x, y, z), "shell");
  const put = (g: THREE.Group, x: number, y: number, z: number, ry: number, d: number) => part(at(g, x, y, z, ry), "furn", d);

  // room shell: oak floor, back wall with a wide window, side wall
  shell(9, 0.12, 7, M.floor, 0, -0.06, 0);
  shell(3, 3, 0.2, M.wall, -3, 1.5, -3.5);
  shell(2, 3, 0.2, M.wall, 3.5, 1.5, -3.5);
  shell(4, 0.8, 0.2, M.wall, 0.5, 0.4, -3.5);
  shell(4, 0.4, 0.2, M.wall, 0.5, 2.8, -3.5);
  shell(0.2, 3, 7, M.wall, -4.5, 1.5, 0);
  [[0.5, 0.82, 4, 0.05], [0.5, 2.58, 4, 0.05], [-1.48, 1.7, 0.05, 1.8], [2.48, 1.7, 0.05, 1.8], [0.5, 1.7, 0.04, 1.8]].forEach(([x, y, w, h]) => shell(w, h, 0.08, M.metal, x, y, -3.42));
  const win = mk(box(3.9, 1.72, 0.01), M.glass, 0.5, 1.7, -3.44);
  win.castShadow = false;
  part(win, "shell");
  // executive desk zone
  put(Bk.execDesk({ w: 2.0, d: 0.9 }), 0.6, 0, -0.9, P, 2);
  put(Bk.execChair(), 0.6, 0, -1.78, 0, 3);
  put(Bk.monitor({ w: 0.62 }), 0.3, 0.772, -0.66, P, 5);
  put(Bk.laptop(), 1.05, 0.772, -1.05, P + 0.2, 5.2);
  put(Bk.guestChair({ fab: M.fabWarm }), 0.1, 0, 0.2, P, 3.4);
  put(Bk.guestChair({ fab: M.fabWarm }), 1.1, 0, 0.2, P, 3.6);
  put(Bk.credenza({ w: 2.2, walnut: true }), 0.6, 0, -3.12, 0, 2.6);
  put(Bk.plant({ h: 0.55 }), 1.45, 0.74, -3.12, 0, 6);
  put(Bk.linear({ l: 1.6, drop: 0.7 }), 0.6, 2.3, -0.9, 0, 7);
  // storage and brand wall
  put(Bk.shelving({ w: 1.8, h: 2.2 }), -4.2, 0, -1.4, H, 2.8);
  put(Bk.logoWall({ w: 2.2, h: 1.2, onLoad: invalidate }), -4.37, 1.7, 1.55, H, 8);
  put(Bk.acoustic({ w: 1.2, h: 1.4 }), -3.0, 1.6, -3.37, 0, 8.4);
  put(Bk.tallCabinet({ w: 0.9 }), 3.55, 0, -3.15, 0, 2.4);
  // lounge corner
  put(Bk.rug({ w: 2.8, d: 2.2, m: M.rug }), -2.3, 0, 1.75, 0, 0.6);
  put(Bk.sofa({ n: 2, fab: M.fabSand }), -2.3, 0, 2.75, P, 2.2);
  put(Bk.sofa({ n: 1, fab: M.fabNavy }), -3.65, 0, 1.45, H, 2.6);
  put(Bk.coffee({ r: 0.42 }), -2.3, 0, 1.6, 0, 4);
  put(Bk.floorLamp(), -3.95, 0, 2.95, 0, 6.2);
  put(Bk.dome({ drop: 0.5 }), -2.3, 2.3, 1.6, 0, 7.2);
  put(Bk.plant({ h: 1.7 }), -3.95, 0, -3.0, 0, 5.6);
  put(Bk.plant({ h: 1.5 }), 4.0, 0, 2.7, 0, 5.8);

  // lights (design values; intensities are set every frame below)
  const hemi = new THREE.HemisphereLight(BRAND.cream, 0x8a7560, 0);
  scene.add(hemi);
  const sunL = new THREE.DirectionalLight(0xfff2dd, 0);
  sunL.castShadow = quality.shadows;
  sunL.shadow.mapSize.set(2048, 2048);
  Object.assign(sunL.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 0.5, far: 45 });
  sunL.shadow.bias = -0.0006;
  sunL.shadow.normalBias = 0.02;
  scene.add(sunL, sunL.target);
  const lamps = [[0.6, 2.0, -0.9], [-2.3, 2.0, 1.6], [-3.9, 2.4, -1.4]].map(([x, y, z], i) => {
    const l = new THREE.PointLight(0xffb46a, 0, 10, 0.75);
    l.position.set(x, y, z);
    if (i === 0 && quality.shadows) {
      l.castShadow = true;
      l.shadow.mapSize.set(1024, 1024);
      l.shadow.bias = -0.002;
    }
    scene.add(l);
    return l;
  });
  const grid = new THREE.GridHelper(9, 18, BRAND.cyan, BRAND.blue);
  const gridMat = grid.material as THREE.LineBasicMaterial;
  grid.position.y = 0.02;
  gridMat.transparent = true;
  gridMat.opacity = 0;
  scene.add(grid);
  const bgDay = new THREE.Color(0xefeae1);
  const bgDawn = new THREE.Color(0xf4dfc3);
  const bgNight = new THREE.Color(BRAND.night);
  const bgPlan = new THREE.Color(BRAND.navy);
  const warm = new THREE.Color(0xffa45c);
  const white = new THREE.Color(0xfff3e0);
  const hemiNight = new THREE.Color(0x9fb3d9);
  const hemiDay = new THREE.Color(BRAND.cream);
  const bg = bgPlan.clone();
  scene.background = bg;

  const applyStage = (stage: number) => {
    meshes.forEach((m) => {
      const mat = baseMat.get(m)!;
      m.material = stage === 0 ? ghost : stage === 1 && !mat.transparent && !(mat as THREE.MeshBasicMaterial).isMeshBasicMaterial ? clay : mat;
      const e = edges.get(m);
      if (e) e.visible = stage <= 1;
    });
    lineMat.color.set(stage === 0 ? 0xbfd8f2 : 0x59637a);
    lineMat.opacity = stage === 0 ? 0.95 : 0.3;
  };

  // drag / touch / arrow keys turn the model; vertical page scroll stays native on touch
  let yawT = 0;
  let yaw = 0;
  let yawV = 0;
  let drag: { x: number; t: number; id: number; moved: boolean } | null = null;
  canvas.tabIndex = 0;
  canvas.style.touchAction = "pan-y";
  canvas.style.cursor = "grab";
  const pd = (e: PointerEvent) => {
    if (e.button > 0) return;
    drag = { x: e.clientX, t: yawT, id: e.pointerId, moved: false };
    yawV = 0;
  };
  const pm = (e: PointerEvent) => {
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
      const nt = clamp(drag.t - dx * 0.0042, -LIM, LIM);
      yawV = nt - yawT;
      yawT = nt;
      invalidate();
    }
  };
  const pu = () => {
    if (drag) {
      drag = null;
      canvas.style.cursor = "grab";
    }
  };
  const kd = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      yawV = 0;
      yawT = clamp(yawT + (e.key === "ArrowLeft" ? 0.18 : -0.18), -LIM, LIM);
      invalidate();
    } else if (e.key === "Home") {
      e.preventDefault();
      yawT = 0;
      invalidate();
    }
  };
  canvas.addEventListener("pointerdown", pd);
  canvas.addEventListener("pointermove", pm);
  canvas.addEventListener("pointerup", pu);
  canvas.addEventListener("pointercancel", pu);
  canvas.addEventListener("pointerleave", pu);
  canvas.addEventListener("keydown", kd);
  ctx.own(() => {
    canvas.removeEventListener("pointerdown", pd);
    canvas.removeEventListener("pointermove", pm);
    canvas.removeEventListener("pointerup", pu);
    canvas.removeEventListener("pointercancel", pu);
    canvas.removeEventListener("pointerleave", pu);
    canvas.removeEventListener("keydown", kd);
  });
  if (section) {
    ctx.own(
      listen(section, P3_RESET, () => {
        yawT = 0;
        yawV = 0;
        invalidate();
      }),
    );
    ctx.own(listen(section, P3_SET, invalidate));
  }

  /** Scroll progress through the pinned section, measured from the live layout every frame. */
  const progress = () => {
    if (!section) return 0;
    const b = section.getBoundingClientRect();
    const span = b.height - window.innerHeight;
    return span > 0 ? clamp(-b.top / span, 0, 1) : 0;
  };
  const manualStage = () => clamp(Number(section?.dataset.stage ?? 0) || 0, 0, 3);

  let lastStage = -1;
  let pe: number | null = null;
  let sun = 0.35;
  let night = 0;
  let plan = 1;
  const POSE = [[0.06, 0.0, 15.6, 0.0], [0.94, 0.74, 14.0, 1.0], [1.0, 0.84, 13.0, 1.0], [1.05, 0.64, 12.5, 1.0]];

  const update = (dt: number) => {
    const f = (rate: number) => (rm ? 1 : 1 - Math.exp(-dt * rate));
    // t runs 0 -> 4 across the section: Discover, Plan, Furnish, Deliver
    let t: number;
    if (rm || !section || section.dataset.pinned === "false") t = manualStage() + 0.999;
    else {
      const p = progress();
      pe = pe == null ? p : pe + (p - pe) * f(6);
      t = Math.min(3.999, pe * 4);
    }
    const stage = Math.floor(t);
    const k = t - stage;
    if (stage !== lastStage) {
      lastStage = stage;
      applyStage(stage);
      if (section && section.dataset.pinned !== "false" && !rm && stage !== manualStage()) emit(section, P3_STAGE, stage);
    }
    // geometry: lines draw in (Discover), clay massing rises (Plan), materials (Furnish), lighting (Deliver)
    for (const o of parts) {
      const u = o.userData as Part;
      const isShell = u.grp === "shell";
      let s = 1;
      let lift = 0;
      if (stage === 0) s = Math.max(0.001, ease((k * 1.7 - (isShell ? 0 : 0.15 + u.d * 0.07)) / 0.6));
      else if (stage === 1 && !isShell) {
        const q = ease((k * 1.6 - (0.05 + u.d * 0.07)) / 0.6);
        lift = (1 - q) * 2.6;
        s = Math.max(0.001, 0.35 + 0.65 * q);
      }
      o.position.y = u.base.y + lift;
      o.scale.setScalar(u.s0 * s);
    }
    const sunT = stage === 3 ? 0.14 + 0.78 * Math.min(1, k / 0.75) : 0.36;
    sun += (sunT - sun) * f(4);
    night += ((stage === 3 && k > 0.78 ? 1 : 0) - night) * f(3.5);
    plan += ((t < 0.85 ? 1 : 0) - plan) * f(4);
    const hi = Math.sin(Math.PI * sun);
    sunL.position.set(-11 + 22 * sun, 2.2 + 10.5 * hi, -12);
    sunL.color.copy(warm).lerp(white, Math.min(1, hi * 1.25));
    sunL.intensity = legacyIntensity((0.7 + 2.6 * hi) * (1 - night) * (1 - plan));
    hemi.intensity = legacyIntensity(((0.34 + 0.38 * hi) * (1 - night) + 0.08 * night) * (1 - plan) + 1.1 * plan);
    hemi.color.copy(night > 0.5 ? hemiNight : hemiDay);
    lamps.forEach((l, i) => (l.intensity = night * (i === 0 ? 3.6 : 2.4) * (1 - plan) * LAMP_K));
    bg.copy(bgDay).lerp(bgDawn, (1 - hi) * 0.55).lerp(bgNight, night).lerp(bgPlan, plan);
    gridMat.opacity = 0.4 * plan;
    ctx.renderer.toneMappingExposure = 1.05 - 0.2 * night;
    // camera: top-down plan -> three-quarter model view -> settles closer as the office is finished
    const a1 = sm(0.55, 1.55, t);
    const a2 = sm(1.7, 2.5, t);
    const a3 = sm(2.7, 3.5, t);
    const mix = (i: number) => {
      const [A, B, C, D] = POSE.map((p) => p[i]);
      return A + (B - A) * a1 + (C - B) * a2 + (D - C) * a3;
    };
    if (!drag && !rm) {
      yawT = clamp(yawT + yawV, -LIM, LIM);
      yawV *= 0.9;
    }
    yaw += (yawT - yaw) * f(7);
    const polar = mix(0);
    const az = mix(1) + yaw * Math.min(1, a1 * 1.2);
    const dist = mix(2);
    const ty = mix(3);
    camera.position.set(0.1 + Math.sin(polar) * Math.sin(az) * dist, ty + Math.cos(polar) * dist, -0.2 + Math.sin(polar) * Math.cos(az) * dist);
    camera.up.set(0, 1, 0);
    camera.lookAt(0.1, ty, -0.2);
  };

  update(0.016);
  return {
    frame: (dt) => update(Math.min(0.05, dt)),
    resize(w, h) {
      camera.fov = w / h < 1 ? 42 : 30;
      camera.updateProjectionMatrix();
    },
  };
};

export default process;
