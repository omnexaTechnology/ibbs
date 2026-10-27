import type * as THREE from "three";
import type { Kit, KitOptions } from "./kit";
import type { Materials } from "./materials";
import type { Quality } from "./renderer";

export type SceneStatus = "idle" | "loading" | "ready" | "unsupported" | "error" | "lost";

/** Everything a scene factory gets from the scene root. */
export type SceneContext = {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  /** Replace or adjust freely; resize keeps `aspect` in sync for a PerspectiveCamera. */
  camera: THREE.PerspectiveCamera;
  quality: Quality;
  /** BR-001: the visitor asked for reduced motion. Build the final state and avoid per-frame animation. */
  reducedMotion: boolean;
  size: () => { width: number; height: number };
  /** Request one more frame (needed when `reducedMotion` is on, or after a state change in on-demand mode). */
  invalidate: () => void;
  /** Register a cleanup that runs when the scene is torn down. */
  own: (fn: () => void) => void;
  /** Shared materials + furniture kit. Both are disposed for you. */
  createKit: (options?: KitOptions) => { M: Materials; K: Kit };
  signal: AbortSignal;
};

export type SceneHandle = {
  /** Per-frame update (animation, damping). Not called per frame under reduced motion. */
  frame?: (dt: number, time: number) => void;
  resize?: (width: number, height: number) => void;
  dispose?: () => void;
};

export type SceneFactory = (ctx: SceneContext) => SceneHandle | void | Promise<SceneHandle | void>;
export type SceneModule = SceneFactory | { default: SceneFactory };
/** Usually `() => import("./scenes/my-scene")`. */
export type SceneLoader = () => Promise<SceneModule>;

export type CameraOptions = { fov?: number; near?: number; far?: number; position?: [number, number, number] };
