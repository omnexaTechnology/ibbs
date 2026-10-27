import * as THREE from "three";

/**
 * The design bundles Three r149; this site uses r186. To render like the design:
 *
 * - Colour management: r149 (legacy mode) used hex colours as authored, without sRGB -> linear conversion, and
 *   encoded the output as sRGB. r152+ converts hex colours to linear by default, which makes the same hex values
 *   darker and more contrasty once lit. `ColorManagement.enabled = false` restores the r149 behaviour; textures
 *   still decode as sRGB via `texture.colorSpace` and the output stays sRGB (`outputColorSpace`, the default).
 * - Lights: r155+ removed legacy lighting (all intensities were scaled by PI). See light-compat.ts.
 * - Shadows: `PCFSoftShadowMap` was removed (r18x). `PCFShadowMap` is the closest.
 * - API renames: `renderer.outputEncoding` -> `outputColorSpace`, `texture.encoding` -> `texture.colorSpace`.
 *
 * This is global Three state, set once. Only the 3D scenes of this site use Three.
 */
export function configureThree() {
  THREE.ColorManagement.enabled = false;
}

import { detectQuality, type Quality } from "./support";

export { detectQuality, hasWebGL, prefersReducedMotion, qualityFor, resetWebGLSupportCache } from "./support";
export type { Quality, QualityEnv } from "./support";

export type RendererOptions = {
  alpha?: boolean;
  /** Tone-mapping exposure (design: 0.95 to 1.05 depending on the scene). */
  exposure?: number;
  quality?: Quality;
  /** Default ACES. The design differs per scene (e.g. the CTA scene uses `THREE.LinearToneMapping`). */
  toneMapping?: THREE.ToneMapping;
};

/** Create the renderer, or `null` when WebGL is not available (the caller shows the fallback image). */
export function createRenderer(canvas: HTMLCanvasElement, options: RendererOptions = {}): THREE.WebGLRenderer | null {
  configureThree();
  const q = options.quality ?? detectQuality();
  let r: THREE.WebGLRenderer;
  try {
    r = new THREE.WebGLRenderer({ canvas, antialias: !q.lowEnd, alpha: !!options.alpha, powerPreference: q.lowEnd ? "default" : "high-performance" });
  } catch {
    return null;
  }
  r.setPixelRatio(Math.min((typeof window !== "undefined" && window.devicePixelRatio) || 1, q.dprCap));
  r.shadowMap.enabled = q.shadows;
  r.shadowMap.type = THREE.PCFShadowMap;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = options.toneMapping ?? THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = options.exposure ?? 1;
  if (options.alpha) r.setClearColor(0x000000, 0);
  return r;
}
