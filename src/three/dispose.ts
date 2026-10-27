import type * as THREE from "three";

/** What a dispose call released. Handy in tests and when hunting leaks (R1). */
export type DisposeStats = { geometries: number; materials: number; textures: number };

const isTexture = (v: unknown): v is THREE.Texture => !!v && typeof v === "object" && (v as { isTexture?: boolean }).isTexture === true;

/** Dispose a material and every texture it references (map, normalMap, emissiveMap, ...). */
export function disposeMaterial(m: THREE.Material, seen: { textures: Set<THREE.Texture>; materials: Set<THREE.Material> } = { textures: new Set(), materials: new Set() }) {
  if (seen.materials.has(m)) return;
  seen.materials.add(m);
  for (const v of Object.values(m)) {
    if (isTexture(v) && !seen.textures.has(v)) {
      seen.textures.add(v);
      v.dispose();
    }
  }
  m.dispose();
}

/**
 * Dispose everything reachable from `root`: geometries, materials and their textures. Shared resources are
 * disposed once. Also handles `scene.background` / `scene.environment` textures.
 */
export function disposeScene(root: THREE.Object3D): DisposeStats {
  const geometries = new Set<THREE.BufferGeometry>();
  const seen = { textures: new Set<THREE.Texture>(), materials: new Set<THREE.Material>() };
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry && !geometries.has(mesh.geometry)) {
      geometries.add(mesh.geometry);
      mesh.geometry.dispose();
    }
    const mat = mesh.material;
    if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((m) => disposeMaterial(m, seen));
  });
  const scene = root as THREE.Scene;
  for (const t of [scene.background, scene.environment]) {
    if (isTexture(t) && !seen.textures.has(t)) {
      seen.textures.add(t);
      t.dispose();
    }
  }
  return { geometries: geometries.size, materials: seen.materials.size, textures: seen.textures.size };
}

/** Dispose a material set (object whose values are materials or arrays of them) that may not be attached to any mesh. */
export function disposeMaterials(set: Record<string, THREE.Material | THREE.Material[]>): DisposeStats {
  const seen = { textures: new Set<THREE.Texture>(), materials: new Set<THREE.Material>() };
  Object.values(set).forEach((v) => (Array.isArray(v) ? v : [v]).forEach((m) => disposeMaterial(m, seen)));
  return { geometries: 0, materials: seen.materials.size, textures: seen.textures.size };
}

/** Release the GL context. `forceContextLoss` frees GPU memory at once instead of waiting for GC (R1). */
export function disposeRenderer(r: THREE.WebGLRenderer) {
  r.dispose();
  r.forceContextLoss();
}

/** Collects teardown callbacks; `disposeAll()` runs them last-in-first-out, once, and survives a throwing callback. */
export class DisposeBag {
  private fns: (() => void)[] = [];
  disposed = false;

  add(fn: () => void) {
    if (this.disposed) {
      fn();
      return;
    }
    this.fns.push(fn);
  }

  disposeAll() {
    if (this.disposed) return;
    this.disposed = true;
    const fns = this.fns.reverse();
    this.fns = [];
    for (const fn of fns) {
      try {
        fn();
      } catch (e) {
        console.error("[three] dispose failed", e);
      }
    }
  }
}
