import * as THREE from "three";

/** One mesh of a model: positions, normals and triangle indices, with the name of its material. */
export type ModelPart = { m: string; p: number[]; n?: number[]; i: number[] };
export type ModelDef = { size: [number, number, number]; parts: ModelPart[] };
export type ModelData = Record<string, ModelDef>;

let cache: Promise<ModelData> | undefined;

/**
 * Load the furniture model library (24 baked models, ~330 kB) on first use. The JSON is a separate chunk, so pages
 * without a model scene never download it.
 */
export function loadModels(): Promise<ModelData> {
  cache ??= import("./models.json").then((m) => m.default as unknown as ModelData);
  return cache;
}

export type ModelGeometryCache = Map<string, THREE.BufferGeometry>;

/**
 * Build a group from a model definition. `mats` maps part material names (wood, metal, carpet, ...) to materials;
 * `_defaultMat` is used for names that are missing. Geometries are cached in `geoCache` so repeated models share them;
 * dispose that cache's values when the scene goes away.
 */
export function modelGroup(data: ModelData | null | undefined, name: string, mats: Record<string, THREE.Material>, scale = 1, geoCache: ModelGeometryCache = new Map()): THREE.Group {
  const g = new THREE.Group();
  const md = data?.[name];
  if (!md) return g;
  md.parts.forEach((p, k) => {
    const key = `${name}:${k}`;
    let geo = geoCache.get(key);
    if (!geo) {
      geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(p.p, 3));
      if (p.n && p.n.length) geo.setAttribute("normal", new THREE.Float32BufferAttribute(p.n, 3));
      else geo.computeVertexNormals();
      geo.setIndex(p.i);
      geoCache.set(key, geo);
    }
    const m = new THREE.Mesh(geo, mats[p.m] ?? mats._defaultMat);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  });
  g.scale.setScalar(scale);
  return g;
}
