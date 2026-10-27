import * as THREE from "three";

/** Brand colours (design BRAND). Hex values are used as authored: see `configureThree()` in renderer.ts. */
export const BRAND = { navy: 0x1e2e5a, blue: 0x2e6eb5, cyan: 0x4ca6cb, green: 0x8bc34a, cream: 0xf5f2ec, night: 0x0b1120 } as const;

/** Small deterministic generator (Lehmer), so the wood grain is the same on every load. */
export function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Procedural wood-grain texture on a 512 px canvas (design `grain`). `ink` is an open rgba prefix, e.g. "rgba(118,78,40,". */
export function grain(base: string, ink: string, planks = false): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  const rnd = seededRandom(7);
  for (let i = 0; i < 140; i++) {
    const y = rnd() * 512;
    const a = 0.03 + rnd() * 0.07;
    const amp = 2 + rnd() * 6;
    const f = 0.004 + rnd() * 0.01;
    g.strokeStyle = ink + a + ")";
    g.lineWidth = 0.6 + rnd() * 1.6;
    g.beginPath();
    for (let x = 0; x <= 512; x += 8) g.lineTo(x, y + Math.sin(x * f + i) * amp);
    g.stroke();
  }
  if (planks) {
    g.strokeStyle = ink + "0.22)";
    g.lineWidth = 2;
    for (let y = 0; y < 512; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
      const off = (y / 64) % 2 ? 160 : 380;
      g.beginPath();
      g.moveTo(off, y);
      g.lineTo(off, y + 64);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

type Std = THREE.MeshStandardMaterial;

export type Materials = {
  oak: Std; walnut: Std; white: Std; grey: Std;
  fabNavy: Std; fabBlue: Std; fabGrey: Std; fabWarm: Std; fabSand: Std;
  mesh: Std; leather: Std; metal: Std; chrome: Std; glass: Std; screen: Std;
  led: THREE.MeshBasicMaterial; ledCool: THREE.MeshBasicMaterial;
  leaf: Std; leaf2: Std; pot: Std; soil: Std; books: Std[];
  floor: Std; carpet: Std; wall: Std; ceiling: Std; rug: Std; stone: Std;
  panel: Std; cream: Std; blue: Std; cyan: Std; green: Std;
};

/** The shared material set (design `materials`). Dispose it with `disposeMaterials()` when the scene goes away. */
export function createMaterials(): Materials {
  const S = (c: number, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0, ...o });
  const floorMap = grain("#cdb08b", "rgba(110,74,40,", true);
  floorMap.repeat.set(5, 5);
  return {
    oak: S(0xffffff, { map: grain("#c9a47a", "rgba(118,78,40,"), roughness: 0.55 }),
    walnut: S(0xffffff, { map: grain("#5d3f2b", "rgba(22,12,6,"), roughness: 0.5 }),
    white: S(0xf3f1ec, { roughness: 0.45 }),
    grey: S(0xc9c6c0, { roughness: 0.5 }),
    fabNavy: S(BRAND.navy, { roughness: 1 }),
    fabBlue: S(BRAND.blue, { roughness: 1 }),
    fabGrey: S(0x8e9298, { roughness: 1 }),
    fabWarm: S(0xd6cdbf, { roughness: 1 }),
    fabSand: S(0xb9ad9b, { roughness: 1 }),
    mesh: S(0x2a2d33, { roughness: 0.9 }),
    leather: S(0x2e2622, { roughness: 0.42 }),
    metal: S(0x23262b, { roughness: 0.38, metalness: 0.65 }),
    chrome: S(0xc8ccd1, { roughness: 0.2, metalness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xd6e8f0, transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0.1, depthWrite: false }),
    screen: S(0x0d1117, { roughness: 0.22, metalness: 0.2, emissive: 0x1b2e4f, emissiveIntensity: 0.55 }),
    led: new THREE.MeshBasicMaterial({ color: 0xffe9cc }),
    ledCool: new THREE.MeshBasicMaterial({ color: 0xf4f7fa }),
    leaf: S(0x4f7a3c, { roughness: 0.8, side: THREE.DoubleSide }),
    leaf2: S(0x3d6331, { roughness: 0.8, side: THREE.DoubleSide }),
    pot: S(0xd9d3c9, { roughness: 0.9 }),
    soil: S(0x3b2d22, { roughness: 1 }),
    books: [S(0x2f3e5c), S(0xc9bfae), S(0x7a8794), S(0xe9e4da), S(0x8c6e52)],
    floor: S(0xffffff, { map: floorMap, roughness: 0.7 }),
    carpet: S(0x8f949b, { roughness: 1 }),
    wall: S(0xf1eee8, { roughness: 0.95 }),
    ceiling: S(0xf6f4f0, { roughness: 1 }),
    rug: S(0xcfc7ba, { roughness: 1 }),
    stone: S(0xe8e4dd, { roughness: 0.32 }),
    panel: S(BRAND.navy, { roughness: 0.7 }),
    cream: S(BRAND.cream, { roughness: 0.8 }),
    blue: S(BRAND.blue, { roughness: 0.6 }),
    cyan: S(BRAND.cyan, { roughness: 0.6 }),
    green: S(BRAND.green, { roughness: 0.6 }),
  };
}

/** Names of the single (non-array) materials, handy for scene layouts that refer to a fabric by name. */
export type MaterialName = Exclude<keyof Materials, "books">;
