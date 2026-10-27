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

export type QualityEnv = {
  coarsePointer: boolean;
  /** `navigator.deviceMemory` in GB (Chromium only). */
  deviceMemory?: number;
  hardwareConcurrency?: number;
  devicePixelRatio?: number;
};

export type Quality = {
  /** Upper bound for the renderer pixel ratio. */
  dprCap: number;
  /** Real-time shadow maps. */
  shadows: boolean;
  lowEnd: boolean;
};

/**
 * R1 (mobile GPU memory): design cap is 1.5 on touch devices and 2 elsewhere. Low-end devices (<= 4 GB memory,
 * or <= 4 cores on a touch device) get a ratio of 1 and no shadow maps.
 */
export function qualityFor(env: QualityEnv): Quality {
  const lowEnd = (env.deviceMemory !== undefined && env.deviceMemory <= 4) || (env.coarsePointer && env.hardwareConcurrency !== undefined && env.hardwareConcurrency <= 4);
  const cap = lowEnd ? 1 : env.coarsePointer ? 1.5 : 2;
  return { dprCap: cap, shadows: !lowEnd, lowEnd };
}

export function detectQuality(): Quality {
  if (typeof window === "undefined") return { dprCap: 1, shadows: false, lowEnd: true };
  const nav = navigator as Navigator & { deviceMemory?: number };
  return qualityFor({
    coarsePointer: !!window.matchMedia && window.matchMedia("(pointer: coarse)").matches,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
  });
}

export const prefersReducedMotion = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type RendererOptions = {
  alpha?: boolean;
  /** Tone-mapping exposure (design: 0.95 to 1.05 depending on the scene). */
  exposure?: number;
  quality?: Quality;
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
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = options.exposure ?? 1;
  if (options.alpha) r.setClearColor(0x000000, 0);
  return r;
}

let webglSupport: boolean | undefined;

/** Cheap feature test that does not load Three: can this browser create a WebGL context? Cached. */
export function hasWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    webglSupport = !!gl;
    // Free the probe context right away (browsers cap the number of live contexts).
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/** Test hook. */
export function resetWebGLSupportCache() {
  webglSupport = undefined;
}
