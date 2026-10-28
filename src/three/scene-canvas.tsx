"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { DisposeBag, disposeMaterials, disposeRenderer, disposeScene } from "./dispose";
import { createKit } from "./kit";
import { RenderLoop } from "./loop";
import { createMaterials } from "./materials";
import { createRenderer } from "./renderer";
import { detectQuality, prefersReducedMotion } from "./support";
import type { CameraOptions, SceneContext, SceneFactory, SceneHandle, SceneLoader, SceneModule, SceneStatus } from "./scene-types";

export type SceneCanvasProps = {
  load: SceneLoader;
  label: string;
  exposure?: number;
  toneMapping?: THREE.ToneMapping;
  alpha?: boolean;
  camera?: CameraOptions;
  /** Margin around the viewport inside which the scene keeps rendering (px). */
  pauseMargin?: number;
  onStatus: (s: SceneStatus) => void;
  className?: string;
};

const resolveFactory = (m: SceneModule): SceneFactory => (typeof m === "function" ? m : m.default);

/**
 * The canvas and everything that touches WebGL. Loaded only in the browser through `next/dynamic` (see scene-root).
 * Lifecycle: create renderer -> load the scene module -> build -> render while visible -> dispose everything on unmount.
 */
export default function SceneCanvas({ load, label, exposure, toneMapping, alpha, camera: cam, pauseMargin = 80, onStatus, className }: SceneCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Scene props are read once per mount: a scene is built once and torn down on unmount.
  const props = useRef({ load, exposure, toneMapping, alpha, cam, pauseMargin });
  // But the status callback may change between renders, so keep the latest one (B1-13).
  const statusRef = useRef(onStatus);
  useEffect(() => {
    statusRef.current = onStatus;
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // And the accessible name follows the locale.
  useEffect(() => {
    canvasRef.current?.setAttribute("aria-label", label);
  }, [label]);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const { load, exposure, toneMapping, alpha, cam, pauseMargin } = props.current;
    const onStatus = (s: SceneStatus) => statusRef.current(s);
    // The canvas is created here, not by React: a context that was force-lost on cleanup cannot be reused, so every
    // mount (including React Strict Mode re-runs in development) needs a fresh element.
    const canvas = document.createElement("canvas");
    canvas.className = className ?? "absolute inset-0 size-full";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", label);
    canvas.dataset.testid = "scene-canvas";
    canvasRef.current = canvas;
    host.appendChild(canvas);
    const bag = new DisposeBag();
    bag.add(() => canvas.remove());
    const abort = new AbortController();
    let cancelled = false;
    bag.add(() => {
      cancelled = true;
      abort.abort();
    });

    const quality = detectQuality();
    const renderer = createRenderer(canvas, { alpha, exposure, toneMapping, quality });
    if (!renderer) {
      onStatus("unsupported");
      return () => bag.disposeAll();
    }
    bag.add(() => disposeRenderer(renderer));
    onStatus("loading");

    const reducedMotion = prefersReducedMotion();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(cam?.fov ?? 45, 1, cam?.near ?? 0.1, cam?.far ?? 200);
    if (cam?.position) camera.position.set(...cam.position);
    let handle: SceneHandle | void;
    let width = 1;
    let height = 1;

    const loop = new RenderLoop({
      mode: reducedMotion ? "on-demand" : "continuous",
      render: (dt, time) => {
        handle?.frame?.(dt, time);
        renderer.render(scene, camera);
      },
    });
    bag.add(() => loop.dispose());
    loop.setVisible(false); // until the observer says otherwise

    const measure = () => {
      const r = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(r.width));
      height = Math.max(1, Math.round(r.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      handle?.resize?.(width, height);
      loop.invalidate();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    bag.add(() => ro.disconnect());

    const io = new IntersectionObserver((entries) => loop.setVisible(entries[entries.length - 1].isIntersecting), { rootMargin: `${pauseMargin}px` });
    io.observe(canvas);
    bag.add(() => io.disconnect());

    const onVisibility = () => loop.setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    bag.add(() => document.removeEventListener("visibilitychange", onVisibility));

    const onLost = (e: Event) => {
      e.preventDefault();
      loop.dispose();
      onStatus("lost");
    };
    canvas.addEventListener("webglcontextlost", onLost);
    bag.add(() => canvas.removeEventListener("webglcontextlost", onLost));

    bag.add(() => {
      handle?.dispose?.();
      disposeScene(scene);
    });

    const ctx: SceneContext = {
      canvas,
      renderer,
      scene,
      camera,
      quality,
      reducedMotion,
      size: () => ({ width, height }),
      invalidate: () => loop.invalidate(),
      own: (fn) => bag.add(fn),
      createKit: (options) => {
        const M = createMaterials();
        const K = createKit(M, options);
        bag.add(() => {
          K.dispose();
          disposeMaterials(M as unknown as Record<string, THREE.Material | THREE.Material[]>);
        });
        return { M, K };
      },
      signal: abort.signal,
    };

    (async () => {
      try {
        const factory = resolveFactory(await load());
        if (cancelled) return;
        handle = await factory(ctx);
        if (cancelled) {
          // Unmounted while the factory was running: its objects were created after the cleanup.
          handle?.dispose?.();
          disposeScene(scene);
          return;
        }
        measure();
        loop.start();
        onStatus("ready");
      } catch (e) {
        if (cancelled) return;
        console.error("[three] scene failed", e);
        loop.dispose();
        onStatus("error");
      }
    })();

    return () => bag.disposeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a scene is built once per mount; props are read from the ref
  }, []);

  return <div ref={ref} className="absolute inset-0" />;
}
