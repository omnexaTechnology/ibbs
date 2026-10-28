import * as THREE from "three";
import { layoutBuilder, walkLayout, CEIL } from "../walk-layout";
import { ZONES, yawTo, type PieceInfo, type PieceType } from "../info";
import type { PieceOptions } from "../kit";
import { BRAND } from "../materials";
import { emit, listen, WK_CLOSE, WK_ENTER, WK_EXIT, WK_GOTO, WK_INSIDE, WK_RESET, WK_SELECT, WK_ZONE } from "../scene-events";
import type { SceneFactory } from "../scene-types";

export type WalkSelection = { type: PieceType; zone: string } | null;

type Box = { x0: number; x1: number; z0: number; z1: number };
type View = { pos: [number, number, number]; yaw: number; pitch: number; fov: number };
type Glide = { p0: THREE.Vector3; p1: THREE.Vector3; y0: number; y1: number; t0p: number; t1p: number; f0: number; f1: number; t0: number; dur: number };
type Mark = { g: THREE.Object3D; at: THREE.Vector3; el?: HTMLButtonElement; vis?: string; act?: boolean; occ?: boolean };
type Piece = THREE.Group & { userData: { type: PieceType; zone: string; info: PieceInfo | null } };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const MARK: Record<string, string[]> = {
  reception: ["reception", "logoWall", "sofa", "coffee", "lounge"],
  work: ["desk", "taskChair", "monitor", "pedestal", "linear"],
  storage: ["tallCabinet"],
  lounge: ["sofa", "lounge", "coffee", "floorLamp", "dome"],
  meeting: ["confTable", "confChair", "tv", "credenza", "acoustic"],
  exec: ["execDesk", "execChair", "guestChair", "credenza", "shelving"],
};
const NOBOX = new Set(["monitor", "keyboard", "linear", "dome", "tv", "acoustic", "logoWall", "rug", "screen"]);
/** One camera path and one look path through the floor: aerial -> entrance -> zones -> executive office. */
const PATH: [[number, number, number], [number, number, number], string][] = [
  [[1.5, 16.5, 17], [0, 0, -0.6], "entrance"], [[-6.0, 1.6, 6.3], [-1.5, 1.3, 2.0], "entrance"], [[-4.4, 1.6, 5.4], [-6.6, 1.15, 3.4], "reception"],
  [[-0.9, 1.6, 6.0], [1.8, 0.95, 3.6], "work"], [[2.3, 1.6, 6.0], [3.9, 0.9, 3.9], "work"], [[5.0, 1.6, 5.4], [7.4, 0.8, 3.6], "lounge"],
  [[0.0, 1.6, 1.0], [0.0, 1.3, -5.0], "storage"], [[-0.2, 1.6, -2.0], [-5.4, 0.9, -3.9], "meeting"], [[0.4, 1.6, -2.4], [5.8, 1.0, -5.0], "exec"], [[3.0, 1.6, -2.6], [5.8, 0.9, -5.0], "exec"],
];

/**
 * Office walk-through (design `initWalk` / `buildWalk` / `tickWalk`): scroll walks a camera through a furnished floor
 * (pinned section), the cursor looks around, blue markers sit on real furniture. "Explore freely" goes full screen with drag to
 * look, WASD / arrows to walk, click the floor to move. Reduced motion (BR-001): no scroll scrubbing, the entrance view stays.
 */
const walk: SceneFactory = (ctx) => {
  const { scene, camera, canvas, renderer, quality, invalidate } = ctx;
  const section = canvas.closest<HTMLElement>("[data-wk]");
  const stageEl = canvas.closest<HTMLElement>(".wk-stage") ?? canvas.parentElement!;
  const marksBox = section?.querySelector<HTMLElement>(".wk-marks") ?? null;
  const tip = section?.querySelector<HTMLElement>(".wk-tip") ?? null;
  const lang = document.documentElement.lang === "ar" ? "ar" : "en";
  const rm = ctx.reducedMotion;
  scene.background = new THREE.Color(0xe6e1d7);
  camera.rotation.order = "YXZ";
  canvas.tabIndex = 0;
  const { M, K } = ctx.createKit();
  const { B: Bk, mk, box } = K;

  // ---- build: every furnished object comes from the shared kit and carries its own label ----
  const occ: THREE.Object3D[] = [];
  const boxes: Box[] = [];
  const picks: THREE.Object3D[] = [];
  const items: Piece[] = [];
  const solid = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, cast = true) => {
    const s = mk(box(w, h, d), m, x, y, z);
    if (!cast) s.castShadow = false;
    scene.add(s);
    occ.push(s);
    return s;
  };
  const wallBox = (x0: number, x1: number, z0: number, z1: number) => boxes.push({ x0, x1, z0, z1 });
  const floor = solid(18, 0.1, 14, M.floor, 0, -0.05, 0, false);
  const ceiling = new THREE.Group();
  scene.add(ceiling);
  ceiling.add(mk(box(18, 0.1, 14), M.ceiling, 0, CEIL + 0.05, 0));
  for (let x = -7.5; x <= 7.5; x += 3)
    for (let z = -5.5; z <= 5.5; z += 2.75) {
      const p = mk(box(1.2, 0.02, 0.6), M.ledCool, x, CEIL - 0.01, z);
      p.castShadow = false;
      ceiling.add(p);
    }
  // walls: solid on three sides, a glazed wall to the east, a feature wall behind reception
  solid(0.2, CEIL, 14, M.wall, -9.1, CEIL / 2, 0);
  wallBox(-10, -8.85, -8, 8);
  solid(18, CEIL, 0.2, M.wall, 0, CEIL / 2, -7.1);
  wallBox(-10, 10, -8, -6.85);
  const front = new THREE.Group();
  scene.add(front);
  const fw = mk(box(18, CEIL, 0.2), M.wall, 0, CEIL / 2, 7.1);
  front.add(fw);
  occ.push(fw);
  wallBox(-10, 10, 6.85, 8);
  solid(0.2, 0.7, 14, M.wall, 9.1, 0.35, 0);
  solid(0.2, 0.35, 14, M.wall, 9.1, CEIL - 0.175, 0);
  wallBox(8.85, 10, -8, 8);
  for (let z = -7; z <= 7.01; z += 2) solid(0.12, CEIL, 0.12, M.metal, 9.02, CEIL / 2, z);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(14, CEIL), new THREE.MeshBasicMaterial({ color: 0xf4f8fb }));
  sky.position.set(9.5, CEIL / 2, 0);
  sky.rotation.y = -Math.PI / 2;
  scene.add(sky);
  const winGlass = mk(box(0.02, CEIL - 1.05, 14), M.glass, 9.05, 0.7 + (CEIL - 1.05) / 2, 0);
  winGlass.castShadow = false;
  scene.add(winGlass);
  solid(3.6, CEIL, 0.16, M.wall, -6.4, CEIL / 2, 1.85);
  wallBox(-8.2, -4.6, 1.6, 2.1);

  walkLayout().forEach((it) => {
    const { fab, ...rest } = it.o;
    const o: PieceOptions = { ...rest, fab: fab ? M[fab] : undefined };
    if (it.t === "rug") o.m = M.rug;
    if (it.t === "lounge") o.n = 1;
    if (it.t === "logoWall") o.onLoad = invalidate;
    const made = Bk[layoutBuilder(it.t)](o);
    const g = made as Piece;
    g.position.set(it.p[0], it.p[1], it.p[2]);
    g.rotation.y = it.r;
    g.userData.zone = it.zone;
    if (it.t === "glass") g.userData.info = null;
    scene.add(g);
    items.push(g);
    if (it.t === "glass") {
      const hw = (it.o.w ?? 3) / 2;
      if (Math.abs(Math.sin(it.r)) < 0.5) wallBox(it.p[0] - hw, it.p[0] + hw, it.p[2] - 0.05, it.p[2] + 0.05);
      else wallBox(it.p[0] - 0.05, it.p[0] + 0.05, it.p[2] - hw, it.p[2] + hw);
    } else if (!NOBOX.has(it.t)) {
      const b = new THREE.Box3().setFromObject(g);
      wallBox(b.min.x, b.max.x, b.min.z, b.max.z);
    }
    if (g.userData.info)
      g.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh && !(m.material as THREE.Material).transparent) {
          m.userData.owner = g;
          picks.push(m);
        }
      });
  });
  picks.push(floor);
  picks.forEach((m) => m !== floor && occ.push(m));

  // one blue marker per piece type and zone, anchored just above (or below, for pendants) the real object
  const cand: Record<string, Mark[]> = {};
  items.forEach((g) => {
    const ty = g.userData.type;
    const z = g.userData.zone;
    if (!g.userData.info || !MARK[z] || !MARK[z].includes(ty)) return;
    const b = new THREE.Box3().setFromObject(g);
    const c = b.getCenter(new THREE.Vector3());
    const wallMounted = ty === "logoWall" || ty === "tv" || ty === "acoustic";
    const y = ty === "linear" || ty === "dome" ? b.min.y - 0.12 : wallMounted ? c.y : b.max.y + 0.12;
    (cand[z + ty] ??= []).push({ g, at: new THREE.Vector3(c.x, y, c.z) });
  });

  // light: sky fill plus daylight through the east glazing; shadows are baked once (the scene is static)
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9ac98, 0.75 * Math.PI);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0dc, 1.6 * Math.PI);
  sun.position.set(22, 13, 5);
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xeaf0f8, 0.35 * Math.PI);
  fill.position.set(-10, 8, -6);
  scene.add(fill);
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const outHover = new THREE.MeshBasicMaterial({ color: BRAND.blue, side: THREE.BackSide, transparent: true, opacity: 0.85, depthWrite: false });
  const outSel = new THREE.MeshBasicMaterial({ color: BRAND.cyan, side: THREE.BackSide, depthWrite: false });
  ctx.own(() => {
    outHover.dispose();
    outSel.dispose();
    (sky.material as THREE.Material).dispose();
  });
  const bounds = { x0: -8.6, x1: 8.6, z0: -6.6, z1: 6.6 };

  // ---- state ----
  const pos = new THREE.Vector3();
  let yaw = 0;
  let pitch = 0;
  let fov = 40;
  let dirty = true;
  let inside = false;
  let glide: Glide | null = null;
  let hover: THREE.Object3D | null = null;
  let sel: THREE.Object3D | null = null;
  let hoverAt: { x: number; y: number } | null = null;
  let down: { x: number; y: number; yaw: number; pitch: number; moved: boolean; id: number } | null = null;
  let keys: Record<string, boolean> = {};
  let mx = 0;
  let my = 0;
  let cmx = 0;
  let cmy = 0;
  let qs = 0;
  let frames = 0;
  let zoneNow = "";
  let tipTimer: ReturnType<typeof setTimeout> | undefined;
  const hoverOutline: THREE.Mesh[] = [];
  const selOutline: THREE.Mesh[] = [];
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pathP = new THREE.CatmullRomCurve3(PATH.map((s) => new THREE.Vector3(...s[0])), false, "centripetal");
  const pathL = new THREE.CatmullRomCurve3(PATH.map((s) => new THREE.Vector3(...s[1])), false, "centripetal");
  const marks: Mark[] = [];
  Object.keys(cand).forEach((key) => {
    const list = cand[key];
    const zone = list[0].g.userData.zone as string;
    const stops = PATH.filter((s) => s[2] === zone || (zone === "storage" && s[2] === "work") || (zone === "lounge" && s[2] === "work")).map((s) => new THREE.Vector3(...s[0]));
    let best = list[0];
    let bd = Infinity;
    list.forEach((m) => {
      const d = Math.min(...stops.map((sp) => sp.distanceTo(m.at)));
      if (d < bd) {
        bd = d;
        best = m;
      }
    });
    marks.push(best);
  });
  const progress = () => {
    if (!section) return 0;
    const b = section.getBoundingClientRect();
    const span = b.height - window.innerHeight;
    return span > 0 ? clamp(-b.top / span, 0, 1) : 0;
  };
  qs = rm ? 0.11 : progress();

  const pieceName = (g: THREE.Object3D) => (g.userData.info as PieceInfo).name[lang];
  const walkView = (v: View) => {
    pos.set(...v.pos);
    yaw = v.yaw;
    pitch = v.pitch;
    fov = v.fov;
    dirty = true;
    invalidate();
  };
  const walkGlide = (v: View, dur: number) => {
    if (rm || !dur) return walkView(v);
    let dy = v.yaw - yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    glide = { p0: pos.clone(), p1: new THREE.Vector3(...v.pos), y0: yaw, y1: yaw + dy, t0p: pitch, t1p: v.pitch, f0: fov, f1: v.fov, t0: performance.now(), dur };
    invalidate();
  };
  const zoneView = (i: number): View => {
    const z = ZONES[i];
    const [fx, fy, fz] = z.pos;
    const [tx, ty, tz] = z.look;
    return { pos: z.pos, yaw: yawTo(z.pos, z.look), pitch: Math.atan2(ty - fy, Math.hypot(tx - fx, tz - fz)), fov: 64 };
  };
  const blocked = (x: number, z: number) => {
    const R = 0.26;
    const b = bounds;
    if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return true;
    for (const w of boxes) if (x > w.x0 - R && x < w.x1 + R && z > w.z0 - R && z < w.z1 + R) return true;
    return false;
  };
  const walkToPoint = (pt: THREE.Vector3) => {
    const x = clamp(pt.x, bounds.x0, bounds.x1);
    const z = clamp(pt.z, bounds.z0, bounds.z1);
    const steps = Math.ceil(Math.hypot(x - pos.x, z - pos.z) / 0.2);
    let leaving = blocked(pos.x, pos.z);
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      const b = blocked(pos.x + (x - pos.x) * t, pos.z + (z - pos.z) * t);
      if (leaving) {
        if (!b) leaving = false;
        continue;
      }
      if (b) return;
    }
    if (leaving) return;
    walkGlide({ pos: [x, 1.6, z], yaw, pitch, fov }, Math.min(1600, 300 + steps * 45));
  };
  const pick = (cx: number, cy: number): { floor: true; point: THREE.Vector3 } | { group: THREE.Object3D } | null => {
    const b = canvas.getBoundingClientRect();
    ndc.set(((cx - b.left) / b.width) * 2 - 1, -((cy - b.top) / b.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(picks, false)[0];
    if (!hit || hit.distance > 14) return null;
    if (hit.object === floor) return { floor: true, point: hit.point };
    return { group: hit.object.userData.owner as THREE.Object3D };
  };
  const outline = (g: THREE.Object3D | null, mat: THREE.Material, list: THREE.Mesh[]) => {
    list.forEach((o) => o.parent?.remove(o));
    list.length = 0;
    if (!g) return;
    const src: THREE.Mesh[] = [];
    g.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh && !(m.material as THREE.Material).transparent && !m.userData.outline) src.push(m);
    });
    src.forEach((c) => {
      const o = new THREE.Mesh(c.geometry, mat);
      o.userData.outline = true;
      o.position.copy(c.position);
      o.rotation.copy(c.rotation);
      o.scale.copy(c.scale).multiplyScalar(1.04);
      c.parent!.add(o);
      list.push(o);
    });
  };
  const tipAt = (g: THREE.Object3D, x: number, y: number, auto: boolean) => {
    if (!tip) return;
    const b = canvas.getBoundingClientRect();
    tip.textContent = pieceName(g);
    tip.style.transform = `translate(${Math.min(x - b.left + 14, b.width - tip.offsetWidth - 8).toFixed(0)}px,${(y - b.top + 14).toFixed(0)}px)`;
    tip.style.opacity = "1";
    clearTimeout(tipTimer);
    tipTimer = undefined;
    if (auto) tipTimer = setTimeout(() => (tip.style.opacity = "0"), 1800);
  };
  const walkHover = (g: THREE.Object3D | null) => {
    const tg = g;
    if (g === sel) g = null;
    if (g !== hover) {
      hover = g;
      outline(g, outHover, hoverOutline);
      dirty = true;
      invalidate();
      canvas.style.cursor = g ? "pointer" : inside ? "grab" : "";
    }
    if (tip) {
      if (tg && hoverAt) tipAt(tg, hoverAt.x, hoverAt.y, false);
      else if (!tipTimer || hoverAt) tip.style.opacity = "0";
    }
  };
  const select = (g: THREE.Object3D | null) => {
    sel = g;
    outline(sel, outSel, selOutline);
    if (sel && hover === sel) {
      hover = null;
      outline(null, outHover, hoverOutline);
    }
    dirty = true;
    invalidate();
    if (section) emit<WalkSelection>(section, WK_SELECT, sel ? { type: sel.userData.type as PieceType, zone: sel.userData.zone as string } : null);
  };

  // blue markers on real furniture (DOM buttons positioned from the 3D anchors)
  marks.forEach((m) => {
    if (!marksBox) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "wk-mk";
    b.dataset.testid = "wk-marker";
    b.setAttribute("aria-label", pieceName(m.g));
    b.innerHTML = "<span></span>";
    const at = () => {
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    b.addEventListener("pointerenter", () => {
      hoverAt = at();
      walkHover(m.g);
    });
    b.addEventListener("pointerleave", () => {
      hoverAt = null;
      walkHover(null);
    });
    b.addEventListener("focus", () => {
      hoverAt = at();
      walkHover(m.g);
    });
    b.addEventListener("blur", () => {
      hoverAt = null;
      walkHover(null);
    });
    b.addEventListener("click", () => select(m.g));
    marksBox.appendChild(b);
    m.el = b;
  });
  ctx.own(() => marks.forEach((m) => m.el?.remove()));

  const placeMarkers = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const show = inside || qs > 0.1;
    const checkOcc = frames++ % 6 === 0;
    for (const m of marks) {
      if (!m.el) continue;
      const v = m.at.clone().project(camera);
      const d = camera.position.distanceTo(m.at);
      let on = show && v.z < 1 && Math.abs(v.x) < 0.94 && Math.abs(v.y) < 0.9 && d < 8.5;
      if (on && checkOcc) {
        ray.set(camera.position, m.at.clone().sub(camera.position).normalize());
        const hit = ray.intersectObjects(occ, false)[0];
        m.occ = !!(hit && hit.distance < d - 0.3 && hit.object.userData.owner !== m.g);
      }
      if (on && m.occ) on = false;
      m.el.style.transform = `translate(${((v.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-v.y * 0.5 + 0.5) * h).toFixed(1)}px)`;
      const vis = on ? "visible" : "hidden";
      if (m.vis !== vis) {
        m.vis = vis;
        m.el.style.visibility = vis;
        m.el.style.opacity = on ? "1" : "0";
      }
      const act = sel === m.g;
      if (m.act !== act) {
        m.act = act;
        m.el.classList.toggle("on", act);
      }
    }
  };

  // ---- free exploration ----
  const enter = () => {
    if (inside) return;
    inside = true;
    ceiling.visible = true;
    front.visible = true;
    renderer.shadowMap.needsUpdate = true;
    document.documentElement.classList.add("wk-lock");
    canvas.style.touchAction = "none";
    canvas.style.cursor = "grab";
    if (section) emit(section, WK_INSIDE, true);
    if (pos.y > 2.5 || blocked(pos.x, pos.z)) walkGlide(zoneView(0), 1400);
    else {
      fov = 64;
      dirty = true;
    }
    invalidate();
    setTimeout(() => {
      try {
        canvas.focus({ preventScroll: true });
      } catch {}
    }, 60);
  };
  const exit = (silent = false) => {
    if (!inside) return;
    inside = false;
    keys = {};
    down = null;
    glide = null;
    walkHover(null);
    document.documentElement.classList.remove("wk-lock");
    canvas.style.touchAction = "";
    canvas.style.cursor = "";
    dirty = true;
    invalidate();
    if (!silent && section) emit(section, WK_INSIDE, false);
  };
  ctx.own(() => exit(true));

  if (section) {
    ctx.own(listen(section, WK_ENTER, enter));
    ctx.own(listen(section, WK_EXIT, () => exit()));
    ctx.own(listen<number>(section, WK_GOTO, (i) => inside && walkGlide(zoneView(i), 1300)));
    ctx.own(listen(section, WK_RESET, () => inside && walkGlide(zoneView(0), 1300)));
    ctx.own(listen(section, WK_CLOSE, () => select(null)));
  }

  // ---- input ----
  const sm = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const b = stageEl.getBoundingClientRect();
    mx = (e.clientX - b.left) / b.width - 0.5;
    my = (e.clientY - b.top) / b.height - 0.5;
    dirty = true;
    invalidate();
  };
  const sl = () => {
    mx = 0;
    my = 0;
    dirty = true;
    invalidate();
  };
  const pd = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY, yaw, pitch, moved: false, id: e.pointerId };
  };
  const pm = (e: PointerEvent) => {
    const d = down;
    if (d) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) > 6) {
        d.moved = true;
        if (inside) {
          try {
            canvas.setPointerCapture(d.id);
          } catch {}
          glide = null;
          walkHover(null);
        }
      }
      if (d.moved && inside) {
        yaw = d.yaw + dx * 0.0042;
        pitch = clamp(d.pitch + dy * 0.003, -0.6, 0.45);
        dirty = true;
        invalidate();
      }
      return;
    }
    if (e.pointerType === "mouse") {
      hoverAt = { x: e.clientX, y: e.clientY };
      if (rm) hoverNow();
      invalidate();
    }
  };
  const pu = (e: PointerEvent) => {
    const d = down;
    down = null;
    if (!d || d.moved) return;
    const hit = pick(e.clientX, e.clientY);
    if (hit && "group" in hit) {
      select(hit.group);
      tipAt(hit.group, e.clientX, e.clientY, e.pointerType !== "mouse");
    } else if (hit && inside) walkToPoint(hit.point);
  };
  const pc = () => (down = null);
  const pl = () => {
    hoverAt = null;
    walkHover(null);
  };
  const hoverNow = () => {
    if (!hoverAt || down) return;
    const hit = pick(hoverAt.x, hoverAt.y);
    walkHover(hit && "group" in hit ? hit.group : null);
  };
  const kd = (e: KeyboardEvent) => {
    if (!inside) {
      if (e.key === "Escape" && sel) select(null);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (sel) select(null);
      else exit();
      return;
    }
    const tag = (e.target as HTMLElement | null)?.tagName ?? "";
    if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k)) {
      keys[k] = true;
      glide = null;
      e.preventDefault();
      invalidate();
    }
  };
  const ku = (e: KeyboardEvent) => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
  };
  stageEl.addEventListener("pointermove", sm);
  stageEl.addEventListener("pointerleave", sl);
  canvas.addEventListener("pointerdown", pd);
  canvas.addEventListener("pointermove", pm);
  canvas.addEventListener("pointerup", pu);
  canvas.addEventListener("pointercancel", pc);
  canvas.addEventListener("pointerleave", pl);
  window.addEventListener("keydown", kd);
  window.addEventListener("keyup", ku);
  ctx.own(() => {
    clearTimeout(tipTimer);
    stageEl.removeEventListener("pointermove", sm);
    stageEl.removeEventListener("pointerleave", sl);
    canvas.removeEventListener("pointerdown", pd);
    canvas.removeEventListener("pointermove", pm);
    canvas.removeEventListener("pointerup", pu);
    canvas.removeEventListener("pointercancel", pc);
    canvas.removeEventListener("pointerleave", pl);
    window.removeEventListener("keydown", kd);
    window.removeEventListener("keyup", ku);
    outline(null, outHover, hoverOutline);
    outline(null, outSel, selOutline);
  });

  // ---- frame ----
  const frame = (dt: number) => {
    const now = performance.now();
    const f = (rate: number) => 1 - Math.exp(-Math.min(0.05, dt) * rate);
    const d = Math.min(0.05, dt);
    if (glide) {
      const g = glide;
      const k = Math.min(1, (now - g.t0) / g.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      pos.lerpVectors(g.p0, g.p1, e);
      yaw = g.y0 + (g.y1 - g.y0) * e;
      pitch = g.t0p + (g.t1p - g.t0p) * e;
      fov = g.f0 + (g.f1 - g.f0) * e;
      if (k >= 1) glide = null;
      dirty = true;
    } else if (inside) {
      const fw = (keys.w || keys.ArrowUp ? 1 : 0) - (keys.s || keys.ArrowDown ? 1 : 0);
      const st = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      const tr = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
      if (tr) {
        yaw += tr * 1.7 * d;
        dirty = true;
      }
      if (fw || st) {
        const sp = 2.3 * d;
        const sy = Math.sin(yaw);
        const cy = Math.cos(yaw);
        const dx = (-sy * fw + cy * st) * sp;
        const dz = (-cy * fw - sy * st) * sp;
        const stuck = blocked(pos.x, pos.z);
        if (stuck || !blocked(pos.x + dx, pos.z)) pos.x += dx;
        if (stuck || !blocked(pos.x, pos.z + dz)) pos.z += dz;
        dirty = true;
      }
      hoverNow();
    } else {
      // scroll walk: the camera follows the path; the cursor adds a gentle look-around (and names what it rests on)
      hoverNow();
      const target = rm ? 0.11 : progress();
      qs += (target - qs) * (rm ? 1 : f(4.5));
      const t = clamp(qs, 0, 1);
      const p = pathP.getPoint(t);
      const l = pathL.getPoint(t);
      cmx += (mx - cmx) * f(3);
      cmy += (my - cmy) * f(3);
      const dx = l.x - p.x;
      const dy = l.y - p.y;
      const dz = l.z - p.z;
      const ny = Math.atan2(-dx, -dz) - cmx * 0.55;
      const np = Math.atan2(dy, Math.hypot(dx, dz)) - cmy * 0.3;
      if (Math.abs(ny - yaw) + Math.abs(np - pitch) + p.distanceTo(pos) > 1e-4) dirty = true;
      pos.copy(p);
      yaw = ny;
      pitch = np;
      fov = 40 + 24 * Math.min(1, t / 0.11);
      const indoors = pos.y < 3.2;
      if (ceiling.visible !== indoors) {
        ceiling.visible = indoors;
        front.visible = indoors;
        renderer.shadowMap.needsUpdate = true;
        dirty = true;
      }
      const zone = PATH[Math.round(t * (PATH.length - 1))][2];
      if (zone !== zoneNow) {
        zoneNow = zone;
        if (section) emit(section, WK_ZONE, zone);
      }
      section?.style.setProperty("--wk-p", t.toFixed(4));
    }
    if (!dirty) return false;
    dirty = false;
    camera.position.copy(pos);
    camera.rotation.set(pitch, yaw, 0, "YXZ");
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const nf = fov + (w / h < 0.9 && fov > 50 ? 10 : 0);
    if (Math.abs(camera.fov - nf) > 0.01) {
      camera.fov = nf;
      camera.updateProjectionMatrix();
    }
    return true;
  };

  const place = () => {
    camera.updateMatrixWorld();
    placeMarkers();
  };
  frame(0.016);
  place();
  // The loop renders every frame while visible; the markers follow the camera whenever it moved.
  return {
    frame: (dt) => {
      if (frame(dt)) place();
    },
    resize: () => {
      dirty = true;
    },
  };
};

export default walk;
