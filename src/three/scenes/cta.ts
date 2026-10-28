import * as THREE from "three";
import { legacyIntensity } from "../light-compat";
import { BRAND } from "../materials";
import { loadModels, modelGroup, type ModelGeometryCache } from "../models";
import type { SceneFactory } from "../scene-types";

const K = 3;

/**
 * Home CTA (design `initCta3d`): a slowly turning desk on a disc, in front of a wall with the IBSS stripes. The camera
 * leans toward the pointer. Linear tone mapping (the design's renderer; the SceneRoot passes it). Reduced motion (BR-001):
 * one still frame, no pointer follow. Only the "offices" workstation set is built (the design's other two sets are empty).
 */
const cta: SceneFactory = (ctx) => {
  const { scene, camera, reducedMotion, invalidate, size } = ctx;
  const std = (c: number, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, ...o });
  const navy = std(BRAND.navy);
  const off = std(BRAND.cream, { roughness: 0.95 });
  const KM: Record<string, THREE.Material> = {
    wood: std(0xd7b48a, { roughness: 0.6 }),
    woodDark: std(0xb48a5e, { roughness: 0.6 }),
    metal: std(0xe6e3dd, { roughness: 0.35, metalness: 0.35 }),
    metalMedium: std(0x3a3f48, { roughness: 0.45, metalness: 0.4 }),
    metalDark: std(0x22262d, { roughness: 0.4, metalness: 0.4 }),
    carpet: navy,
    carpetBlue: std(BRAND.blue, { roughness: 0.9 }),
    carpetDarker: std(0x8a8d93, { roughness: 1 }),
    carpetWhite: std(0xf4f1ec, { roughness: 1 }),
    plant: std(0x6f9e46),
    lamp: std(BRAND.cream, { emissive: 0xffe2b8, emissiveIntensity: 0.25 }),
    glass: std(0xbfe0ea, { transparent: true, opacity: 0.5 }),
    _defaultMat: std(0xf2efea, { roughness: 0.6 }),
  };
  ctx.own(() => [navy, off, ...Object.values(KM)].forEach((m) => m.dispose()));

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c7da, legacyIntensity(0.9)));
  const sun = new THREE.DirectionalLight(0xfff4e6, legacyIntensity(1.25));
  sun.position.set(5, 9, 6);
  sun.castShadow = ctx.quality.shadows;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const g = new THREE.Group();
  scene.add(g);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 0.16, 72), off);
  disc.position.y = -0.08;
  disc.receiveShadow = true;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(2.94, 2.94, 0.1, 72), navy);
  rim.position.y = -0.17;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 0.12), off);
  wall.position.set(0, 1.3, -2.2);
  wall.castShadow = wall.receiveShadow = true;
  g.add(disc, rim, wall);
  ([[BRAND.blue, -0.5], [BRAND.cyan, -0.1], [BRAND.green, 0.3]] as const).forEach(([c, x]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.9, 0.04), std(c));
    b.position.set(x, 1.7, -2.12);
    b.rotation.z = -0.45;
    g.add(b);
    ctx.own(() => (b.material as THREE.Material).dispose());
  });

  const geoCache: ModelGeometryCache = new Map();
  ctx.own(() => geoCache.forEach((geo) => geo.dispose()));
  void loadModels().then((data) => {
    if (ctx.signal.aborted) return;
    const put = (name: string, x: number, y: number, z: number, ry = 0, s = K) => {
      const m = modelGroup(data, name, KM, s, geoCache);
      m.position.set(x, y, z);
      m.rotation.y = ry;
      g.add(m);
    };
    const DH = data.desk.size[1] * K;
    put("rugRectangle", 0, 0.01, 0.2, 0, 2.6);
    put("desk", 0, 0, -0.9);
    put("computerScreen", 0, DH, -1.15);
    put("computerKeyboard", 0, DH, -0.75);
    put("lampSquareTable", 0.85, DH, -1.1);
    put("chairDesk", 0.1, 0, 0.35, Math.PI + 0.35);
    put("pottedPlant", -1.75, 0, -1.4, 0, 3.2);
    put("bookcaseOpen", 1.75, 0, -1.65, 0, 2.6);
    put("sideTableDrawers", -1.4, 0, 0.6, 0.6, 2.4);
    put("lampRoundFloor", 2.2, 0, 0.4, 0, 2.6);
    invalidate();
  });

  // fit the model to the canvas, like the design (R = 3.05)
  const dir = new THREE.Vector3(5.6, 4.0, 6.2).normalize();
  const tgt = new THREE.Vector3(0, 0.95, -0.3);
  let dist = 9;
  const fit = (w: number, h: number) => {
    const vf = (camera.fov * Math.PI) / 360;
    const hf = Math.atan(Math.tan(vf) * (w / h));
    dist = Math.max(3.05 / Math.sin(vf), 3.05 / Math.sin(hf)) * 1.04;
  };
  const s0 = size();
  fit(s0.width, s0.height);
  camera.position.copy(tgt).addScaledVector(dir, dist);
  camera.lookAt(tgt);

  let mx = 0;
  let my = 0;
  const onMove = (e: PointerEvent) => {
    mx = e.clientX / window.innerWidth - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  };
  if (!reducedMotion) window.addEventListener("pointermove", onMove);
  ctx.own(() => window.removeEventListener("pointermove", onMove));
  const want = new THREE.Vector3();

  return {
    resize: fit,
    frame: () => {
      g.rotation.y += 0.0028;
      g.rotation.x += (my * 0.12 - g.rotation.x) * 0.05;
      want.copy(tgt).addScaledVector(dir, dist);
      want.x += mx * 0.9;
      camera.position.lerp(want, 0.08);
      camera.lookAt(tgt);
    },
  };
};

export default cta;
