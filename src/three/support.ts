/**
 * Three-free helpers. `scene-root.tsx` imports this module, so it must never import "three" (directly or not):
 * that would put Three in the entry chunk of every page with a scene (REQ-012).
 */

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
 * R1 (mobile GPU memory): design cap is 1.5 on touch devices and 2 elsewhere. Low-end devices (reported memory below 4 GB, i.e. 2 GB or less: Chromium rounds the value down to a power of two,
 * or <= 4 cores on a touch device) get a ratio of 1 and no shadow maps.
 */
export function qualityFor(env: QualityEnv): Quality {
  const lowEnd = (env.deviceMemory !== undefined && env.deviceMemory < 4) || (env.coarsePointer && env.hardwareConcurrency !== undefined && env.hardwareConcurrency <= 4);
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

let webglSupport: boolean | undefined;

/** Cheap feature test that does not load Three: can this browser create a WebGL 2 context (Three r163+ needs it)? Cached. */
export function hasWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
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
