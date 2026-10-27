import * as THREE from "three";
import { INFO, type PieceType } from "./info";
import { seededRandom, type Materials } from "./materials";

/**
 * IBSS 3D kit: procedural, licence-free office furniture shared by every scene on the site.
 * Each piece is a named group (`userData.type`, `userData.info`) so scenes can label, list and select real objects.
 * Ported from the design's `IBSS3D.kit`; dimensions are in metres and unchanged.
 */

type Mat = THREE.Material;

export type PieceOptions = {
  w?: number;
  d?: number;
  h?: number;
  l?: number;
  r?: number;
  n?: number;
  drop?: number;
  oak?: boolean;
  walnut?: boolean;
  fab?: Mat;
  type?: PieceType;
  m?: Mat;
  /** logoWall: called once the logo texture has loaded and been added (e.g. to render a frame). */
  onLoad?: () => void;
};

export type KitOptions = {
  /** Brand logo for the `logoWall` piece (design: the light logo). */
  logoUrl?: string;
};

export type BuilderName = keyof Builders;

export type Kit = {
  B: Builders;
  box: (w: number, h: number, d: number) => THREE.BoxGeometry;
  cyl: (a: number, b: number, h: number, s?: number) => THREE.CylinderGeometry;
  rbox: (w: number, h: number, d: number, r: number) => THREE.BufferGeometry;
  mk: Mk;
  at: <T extends THREE.Object3D>(g: T, x: number, y?: number, z?: number, ry?: number) => T;
  INFO: typeof INFO;
  /** Dispose cached geometries and cancel a pending logo load. Call when the scene is torn down. */
  dispose: () => void;
};

type Mk = (g: THREE.BufferGeometry, m: Mat, x: number, y: number, z: number, rx?: number, ry?: number, rz?: number) => THREE.Mesh;
type Builder = (o?: PieceOptions) => THREE.Group;
type Builders = Record<"desk" | "execDesk" | "taskChair" | "execChair" | "guestChair" | "confChair" | "confTable" | "credenza" | "tallCabinet" | "shelving" | "pedestal" | "monitor" | "keyboard" | "laptop" | "screen" | "tv" | "reception" | "sofa" | "coffee" | "plant" | "glass" | "acoustic" | "linear" | "dome" | "floorLamp" | "logoWall" | "bench" | "rug", Builder>;

export function createKit(M: Materials, options: KitOptions = {}): Kit {
  const logoUrl = options.logoUrl ?? "/brand/logo-light.png";
  const cache = new Map<string, THREE.BufferGeometry>();
  let disposed = false;
  const extraTextures: THREE.Texture[] = [];

  function geo<G extends THREE.BufferGeometry>(k: string, f: () => G): G {
    let g = cache.get(k) as G | undefined;
    if (!g) {
      g = f();
      cache.set(k, g);
    }
    return g;
  }
  const box = (w: number, h: number, d: number) => geo(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
  const cyl = (a: number, b: number, h: number, s?: number) => geo(`c${a}|${b}|${h}|${s || 20}`, () => new THREE.CylinderGeometry(a, b, h, s || 20));
  const sph = (r: number) => geo(`s${r}`, () => new THREE.SphereGeometry(r, 12, 8));
  /** Box with rounded edges: a rounded-rectangle profile extruded and bevelled. */
  const rbox = (w: number, h: number, d: number, r: number) =>
    geo(`r${w}|${h}|${d}|${r}`, () => {
      const iw = Math.max(0.002, w - 2 * r);
      const ih = Math.max(0.002, h - 2 * r);
      const cr = Math.min(iw, ih) * 0.3;
      const s = new THREE.Shape();
      const x = -iw / 2;
      const y = -ih / 2;
      s.moveTo(x + cr, y);
      s.lineTo(x + iw - cr, y);
      s.quadraticCurveTo(x + iw, y, x + iw, y + cr);
      s.lineTo(x + iw, y + ih - cr);
      s.quadraticCurveTo(x + iw, y + ih, x + iw - cr, y + ih);
      s.lineTo(x + cr, y + ih);
      s.quadraticCurveTo(x, y + ih, x, y + ih - cr);
      s.lineTo(x, y + cr);
      s.quadraticCurveTo(x, y, x + cr, y);
      const depth = Math.max(0.002, d - 2 * r);
      const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 4 });
      g.translate(0, 0, -depth / 2);
      g.computeVertexNormals();
      return g;
    });
  const mk: Mk = (g, m, x, y, z, rx, ry, rz) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.rotation.set(rx || 0, ry || 0, rz || 0);
    o.castShadow = true;
    o.receiveShadow = true;
    return o;
  };
  const piece = (type: PieceType | "") => {
    const g = new THREE.Group();
    g.userData.type = type;
    if (type && type in INFO) g.userData.info = INFO[type];
    return g;
  };
  const at = <T extends THREE.Object3D>(g: T, x: number, y = 0, z = 0, ry = 0) => {
    g.position.set(x, y, z);
    g.rotation.y = ry;
    return g;
  };
  const rnd = seededRandom(11);

  const starBase = (g: THREE.Group, y: number, r: number) => {
    g.add(mk(cyl(0.035, 0.035, 0.05), M.metal, 0, y + 0.02, 0));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.add(mk(box(r, 0.025, 0.04), M.metal, (Math.cos(a) * r) / 2, y + 0.03, (Math.sin(a) * r) / 2, 0, -a, 0));
      g.add(mk(sph(0.024), M.metal, Math.cos(a) * r, y + 0.024, Math.sin(a) * r));
    }
  };

  const B: Builders = {
    desk(o = {}) {
      const w = o.w || 1.4;
      const d = o.d || 0.75;
      const g = piece("desk");
      g.add(mk(box(w, 0.025, d), o.oak ? M.oak : M.white, 0, 0.735, 0));
      [-1, 1].forEach((s) => {
        const x = s * (w / 2 - 0.05);
        g.add(mk(box(0.05, 0.7, 0.05), M.metal, x, 0.36, d / 2 - 0.06));
        g.add(mk(box(0.05, 0.7, 0.05), M.metal, x, 0.36, -d / 2 + 0.06));
        g.add(mk(box(0.06, 0.03, d - 0.04), M.metal, x, 0.015, 0));
        g.add(mk(box(0.04, 0.04, d - 0.1), M.metal, x, 0.7, 0));
      });
      g.add(mk(box(w - 0.16, 0.3, 0.014), M.grey, 0, 0.52, -d / 2 + 0.08));
      return g;
    },
    execDesk(o = {}) {
      const w = o.w || 2.0;
      const d = o.d || 0.9;
      const g = piece("execDesk");
      g.add(mk(box(w, 0.045, d), M.walnut, 0, 0.75, 0));
      g.add(mk(box(0.05, 0.73, d - 0.04), M.walnut, -w / 2 + 0.03, 0.365, 0));
      g.add(mk(box(0.42, 0.68, d - 0.08), M.white, w / 2 - 0.25, 0.36, 0));
      [0.2, 0.42, 0.6].forEach((y) => g.add(mk(box(0.4, 0.006, 0.01), M.metal, w / 2 - 0.25, y, d / 2 - 0.035)));
      g.add(mk(box(w - 0.5, 0.36, 0.02), M.walnut, -0.2, 0.5, -d / 2 + 0.1));
      return g;
    },
    taskChair(o = {}) {
      const g = piece("taskChair");
      const seat = o.fab || M.fabGrey;
      starBase(g, 0, 0.3);
      g.add(mk(cyl(0.022, 0.022, 0.3), M.chrome, 0, 0.22, 0));
      g.add(mk(rbox(0.5, 0.075, 0.48, 0.025), seat, 0, 0.45, 0));
      g.add(mk(rbox(0.46, 0.55, 0.035, 0.012), M.mesh, 0, 0.82, -0.25, -0.12));
      g.add(mk(box(0.05, 0.3, 0.04), M.metal, 0, 0.6, -0.24));
      [-1, 1].forEach((s) => {
        g.add(mk(box(0.03, 0.18, 0.04), M.metal, s * 0.26, 0.56, -0.02));
        g.add(mk(rbox(0.07, 0.03, 0.25, 0.01), M.metal, s * 0.26, 0.66, -0.02));
      });
      return g;
    },
    execChair() {
      const g = piece("execChair");
      starBase(g, 0, 0.33);
      g.add(mk(cyl(0.024, 0.024, 0.3), M.chrome, 0, 0.22, 0));
      g.add(mk(rbox(0.54, 0.1, 0.52, 0.04), M.leather, 0, 0.47, 0));
      g.add(mk(rbox(0.52, 0.82, 0.09, 0.035), M.leather, 0, 0.95, -0.27, -0.1));
      [-1, 1].forEach((s) => g.add(mk(rbox(0.07, 0.04, 0.32, 0.015), M.chrome, s * 0.3, 0.66, -0.02)));
      return g;
    },
    guestChair(o = {}) {
      const g = piece(o.type || "guestChair");
      const f = o.fab || M.fabWarm;
      [-1, 1].forEach((s) => {
        const x = s * 0.22;
        g.add(mk(cyl(0.011, 0.011, 0.5, 8), M.chrome, x, 0.012, 0, Math.PI / 2, 0, 0));
        g.add(mk(cyl(0.011, 0.011, 0.44, 8), M.chrome, x, 0.23, 0.24));
        g.add(mk(cyl(0.011, 0.011, 0.44, 8), M.chrome, x, 0.66, -0.22));
      });
      g.add(mk(rbox(0.5, 0.06, 0.48, 0.022), f, 0, 0.46, 0.02));
      g.add(mk(rbox(0.48, 0.38, 0.05, 0.02), f, 0, 0.74, -0.22, -0.08));
      return g;
    },
    confChair(o = {}) {
      const g = piece("confChair");
      const f = o.fab || M.fabNavy;
      starBase(g, 0, 0.28);
      g.add(mk(cyl(0.022, 0.022, 0.3), M.chrome, 0, 0.22, 0));
      g.add(mk(rbox(0.5, 0.07, 0.48, 0.025), f, 0, 0.45, 0));
      g.add(mk(rbox(0.48, 0.48, 0.05, 0.02), f, 0, 0.78, -0.23, -0.1));
      return g;
    },
    confTable(o = {}) {
      const l = o.l || 3.2;
      const w = o.w || 1.2;
      const g = piece("confTable");
      g.add(mk(rbox(l, 0.045, w, 0.012), M.oak, 0, 0.745, 0));
      [-1, 1].forEach((s) => {
        g.add(mk(box(0.1, 0.7, w * 0.5), M.metal, s * l * 0.28, 0.36, 0));
        g.add(mk(box(0.42, 0.02, w * 0.62), M.metal, s * l * 0.28, 0.01, 0));
      });
      g.add(mk(box(0.26, 0.006, 0.12), M.metal, 0, 0.771, 0));
      return g;
    },
    credenza(o = {}) {
      const w = o.w || 1.8;
      const g = piece("credenza");
      const m = o.walnut ? M.walnut : M.white;
      g.add(mk(box(w, 0.62, 0.45), m, 0, 0.43, 0));
      const n = Math.max(2, Math.round(w / 0.6));
      for (let i = 1; i < n; i++) g.add(mk(box(0.006, 0.6, 0.006), M.metal, -w / 2 + (i * w) / n, 0.43, 0.228));
      for (let i = 0; i < n; i++) g.add(mk(box(0.012, 0.12, 0.02), M.chrome, -w / 2 + ((i + 0.5) * w) / n + (i % 2 ? -0.1 : 0.1) * (w / n) * 2.4, 0.5, 0.235));
      ([[-1, -1], [-1, 1], [1, -1], [1, 1]] as const).forEach(([a, b]) => g.add(mk(box(0.03, 0.12, 0.03), M.metal, a * (w / 2 - 0.06), 0.06, b * 0.17)));
      return g;
    },
    tallCabinet(o = {}) {
      const w = o.w || 0.9;
      const g = piece("tallCabinet");
      g.add(mk(box(w, 2.0, 0.45), M.white, 0, 1.0, 0));
      g.add(mk(box(0.006, 1.96, 0.006), M.metal, 0, 1.0, 0.228));
      [-1, 1].forEach((s) => g.add(mk(box(0.014, 0.28, 0.02), M.chrome, s * 0.05, 1.05, 0.235)));
      return g;
    },
    shelving(o = {}) {
      const w = o.w || 1.8;
      const h = o.h || 2.0;
      const g = piece("shelving");
      const m = o.oak ? M.oak : M.walnut;
      [-1, 0, 1].forEach((s) => g.add(mk(box(0.03, h, 0.36), M.metal, s * (w / 2 - 0.015), h / 2, 0)));
      for (let k = 0; k < 5; k++) {
        const y = 0.06 + (k * (h - 0.12)) / 4;
        g.add(mk(box(w, 0.025, 0.36), m, 0, y, 0));
        if (k === 4) continue;
        let x = -w / 2 + 0.06;
        while (x < w / 2 - 0.12) {
          if (rnd() < 0.3) {
            x += 0.12 + rnd() * 0.2;
            continue;
          }
          const n = 3 + Math.floor(rnd() * 6);
          const bw = 0.025 + rnd() * 0.015;
          for (let j = 0; j < n && x < w / 2 - 0.06; j++) {
            const bh = 0.2 + rnd() * 0.1;
            g.add(mk(box(bw, bh, 0.24), M.books[Math.floor(rnd() * 5)], x, y + 0.012 + bh / 2, 0.02));
            x += bw + 0.003;
          }
          x += 0.08;
        }
      }
      return g;
    },
    pedestal() {
      const g = piece("pedestal");
      g.add(mk(box(0.4, 0.56, 0.5), M.white, 0, 0.32, 0));
      [0.2, 0.36, 0.48].forEach((y) => g.add(mk(box(0.38, 0.005, 0.01), M.metal, 0, y, 0.252)));
      [0.27, 0.42, 0.53].forEach((y) => g.add(mk(box(0.12, 0.012, 0.02), M.chrome, 0, y, 0.26)));
      ([[-1, -1], [-1, 1], [1, -1], [1, 1]] as const).forEach(([a, b]) => g.add(mk(sph(0.02), M.metal, a * 0.16, 0.02, b * 0.2)));
      return g;
    },
    monitor(o = {}) {
      const w = o.w || 0.6;
      const g = piece("monitor");
      g.add(mk(box(w, w * 0.58, 0.022), M.metal, 0, 0.17 + w * 0.29, 0));
      g.add(mk(box(w - 0.02, w * 0.58 - 0.02, 0.002), M.screen, 0, 0.17 + w * 0.29, 0.012));
      g.add(mk(box(0.05, 0.2, 0.02), M.metal, 0, 0.1, -0.03));
      g.add(mk(box(0.22, 0.012, 0.16), M.metal, 0, 0.006, -0.02));
      return g;
    },
    keyboard() {
      const g = new THREE.Group();
      g.add(mk(box(0.42, 0.015, 0.13), M.white, 0, 0.008, 0));
      g.add(mk(box(0.06, 0.02, 0.1), M.white, 0.3, 0.01, 0));
      return g;
    },
    laptop() {
      const g = new THREE.Group();
      g.add(mk(box(0.34, 0.015, 0.24), M.chrome, 0, 0.008, 0));
      g.add(mk(box(0.34, 0.23, 0.008), M.chrome, 0, 0.12, -0.12, -0.25));
      g.add(mk(box(0.32, 0.2, 0.002), M.screen, 0, 0.12, -0.114, -0.25));
      return g;
    },
    screen(o = {}) {
      const w = o.w || 2.8;
      const g = piece("screen");
      g.add(mk(rbox(w, 0.4, 0.03, 0.01), M.fabNavy, 0, 0.96, 0));
      return g;
    },
    tv(o = {}) {
      const w = o.w || 1.8;
      const g = piece("tv");
      g.add(mk(box(w, w * 0.5625, 0.04), M.metal, 0, 0, 0));
      g.add(mk(box(w - 0.03, w * 0.5625 - 0.03, 0.002), M.screen, 0, 0, 0.021));
      return g;
    },
    reception(o = {}) {
      const w = o.w || 2.8;
      const g = piece("reception");
      g.add(mk(box(w, 1.05, 0.7), M.white, 0, 0.53, 0));
      for (let x = -w / 2 + 0.04; x < w / 2; x += 0.09) g.add(mk(box(0.05, 0.98, 0.04), M.oak, x, 0.53, 0.37));
      g.add(mk(box(w + 0.06, 0.04, 0.82), M.stone, 0, 1.09, 0.04));
      g.add(mk(box(w - 0.1, 0.03, 0.4), M.white, 0, 0.74, -0.52));
      g.add(mk(box(w - 0.1, 0.02, 0.02), M.led, 0, 0.03, 0.4));
      return g;
    },
    sofa(o = {}) {
      const n = o.n || 3;
      const sw = 0.66;
      const w = n * sw + 0.32;
      const f = o.fab || M.fabSand;
      const g = piece(n === 1 ? "lounge" : "sofa");
      g.add(mk(rbox(w, 0.22, 0.86, 0.03), f, 0, 0.24, 0));
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + 0.16 + sw * (i + 0.5);
        g.add(mk(rbox(sw - 0.02, 0.14, 0.64, 0.05), f, x, 0.42, 0.08));
        g.add(mk(rbox(sw - 0.02, 0.44, 0.18, 0.06), f, x, 0.64, -0.3, -0.12));
      }
      [-1, 1].forEach((s) => g.add(mk(rbox(0.16, 0.48, 0.86, 0.05), f, s * (w / 2 - 0.08), 0.39, 0)));
      ([[-1, -1], [-1, 1], [1, -1], [1, 1]] as const).forEach(([a, b]) => g.add(mk(cyl(0.015, 0.012, 0.13, 8), M.metal, a * (w / 2 - 0.06), 0.065, b * 0.36)));
      return g;
    },
    coffee(o = {}) {
      const r = o.r || 0.5;
      const g = piece("coffee");
      g.add(mk(cyl(r, r, 0.03, 40), M.stone, 0, 0.4, 0));
      g.add(mk(cyl(0.05, 0.05, 0.38, 12), M.metal, 0, 0.2, 0));
      g.add(mk(cyl(r * 0.5, r * 0.5, 0.02, 30), M.metal, 0, 0.01, 0));
      return g;
    },
    plant(o = {}) {
      const h = o.h || 1.5;
      const k = h / 1.5;
      const g = piece("plant");
      g.add(mk(cyl(0.2 * k, 0.15 * k, 0.42 * k, 24), M.pot, 0, 0.21 * k, 0));
      g.add(mk(cyl(0.18 * k, 0.18 * k, 0.02, 20), M.soil, 0, 0.41 * k, 0));
      const leaf = geo("leaf", () => {
        const s = new THREE.SphereGeometry(1, 10, 6);
        s.scale(0.16, 0.02, 0.07);
        s.translate(0.14, 0, 0);
        return s;
      });
      for (let i = 0; i < 26; i++) {
        const a = rnd() * Math.PI * 2;
        const y = h * (0.42 + rnd() * 0.58);
        const t = 0.25 + rnd() * 0.9;
        const l = new THREE.Mesh(leaf, i % 3 ? M.leaf : M.leaf2);
        l.position.set(Math.cos(a) * 0.06, y, Math.sin(a) * 0.06);
        l.rotation.set(0, -a, -t + 0.6);
        l.scale.setScalar(k * (0.8 + rnd() * 0.5));
        l.castShadow = true;
        g.add(l);
      }
      for (let i = 0; i < 4; i++) g.add(mk(cyl(0.008, 0.01, h * 0.55, 6), M.leaf2, (rnd() - 0.5) * 0.08, h * 0.6, (rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.4, 0, (rnd() - 0.5) * 0.4));
      return g;
    },
    glass(o = {}) {
      const w = o.w || 3;
      const h = o.h || 2.7;
      const g = piece("glass");
      const gl = new THREE.Mesh(box(w, h, 0.012), M.glass);
      gl.position.set(0, h / 2, 0);
      gl.renderOrder = 2;
      g.add(gl);
      g.add(mk(box(w, 0.05, 0.06), M.metal, 0, h - 0.025, 0));
      g.add(mk(box(w, 0.05, 0.06), M.metal, 0, 0.025, 0));
      for (let x = -w / 2; x <= w / 2 + 0.001; x += w / Math.max(1, Math.round(w / 1.2))) g.add(mk(box(0.035, h, 0.05), M.metal, x, h / 2, 0));
      return g;
    },
    acoustic(o = {}) {
      const w = o.w || 1.2;
      const h = o.h || 1.2;
      const g = piece("acoustic");
      g.add(mk(rbox(w, h, 0.05, 0.015), o.fab || M.fabNavy, 0, 0, 0));
      return g;
    },
    linear(o = {}) {
      const l = o.l || 1.6;
      const drop = o.drop || 0.8;
      const g = piece("linear");
      g.add(mk(box(l, 0.05, 0.08), M.metal, 0, 0, 0));
      g.add(mk(box(l - 0.04, 0.01, 0.06), M.led, 0, -0.03, 0));
      [-1, 1].forEach((s) => g.add(mk(cyl(0.003, 0.003, drop, 4), M.metal, s * (l / 2 - 0.1), drop / 2, 0)));
      return g;
    },
    dome(o = {}) {
      const drop = o.drop || 1;
      const g = piece("dome");
      const prof = ([[0.02, 0.24], [0.08, 0.22], [0.2, 0.14], [0.27, 0.04], [0.28, 0]] as const).map(([x, y]) => new THREE.Vector2(x, y));
      const sh = new THREE.Mesh(geo("dome", () => new THREE.LatheGeometry(prof, 32)), M.metal);
      sh.castShadow = true;
      g.add(sh);
      const inner = new THREE.Mesh(geo("domeIn", () => new THREE.CircleGeometry(0.26, 24)), M.led);
      inner.rotation.x = Math.PI / 2;
      inner.position.y = 0.02;
      g.add(inner);
      g.add(mk(cyl(0.004, 0.004, drop, 4), M.metal, 0, 0.24 + drop / 2, 0));
      return g;
    },
    floorLamp() {
      const g = piece("floorLamp");
      g.add(mk(cyl(0.16, 0.16, 0.02, 24), M.metal, 0, 0.01, 0));
      g.add(mk(cyl(0.012, 0.012, 1.45, 8), M.metal, 0, 0.74, 0));
      g.add(mk(cyl(0.17, 0.21, 0.28, 24), M.fabWarm, 0, 1.52, 0));
      return g;
    },
    logoWall(o = {}) {
      const w = o.w || 2.6;
      const h = o.h || 1.4;
      const g = piece("logoWall");
      g.add(mk(box(w, h, 0.04), M.panel, 0, 0, 0));
      const plate = new THREE.Mesh(box(w * 0.78, h * 0.62, 0.012), M.cream);
      plate.position.z = 0.026;
      g.add(plate);
      new THREE.TextureLoader().load(logoUrl, (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        extraTextures.push(tex);
        const img = tex.image as { width: number; height: number } | undefined;
        const ar = (img && img.width / img.height) || 3.1;
        const lw = Math.min(w * 0.7, h * 0.5 * ar);
        const lg = new THREE.Mesh(new THREE.PlaneGeometry(lw, lw / ar), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
        lg.position.z = 0.034;
        g.add(lg);
        o.onLoad?.();
      });
      return g;
    },
    bench(o = {}) {
      const w = o.w || 1.6;
      const g = piece("bench");
      g.add(mk(rbox(w, 0.12, 0.48, 0.03), M.fabNavy, 0, 0.42, 0));
      [-1, 1].forEach((s) => g.add(mk(box(0.04, 0.36, 0.42), M.metal, s * (w / 2 - 0.1), 0.18, 0)));
      return g;
    },
    rug(o = {}) {
      const g = new THREE.Group();
      g.add(mk(box(o.w ?? 1, 0.008, o.d ?? 1), o.m || M.rug, 0, 0.004, 0));
      return g;
    },
  };

  return {
    B,
    box,
    cyl,
    rbox,
    mk,
    at,
    INFO,
    dispose() {
      disposed = true;
      cache.forEach((g) => g.dispose());
      cache.clear();
      extraTextures.forEach((t) => t.dispose());
      extraTextures.length = 0;
    },
  };
}
