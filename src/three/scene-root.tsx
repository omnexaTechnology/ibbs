"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useState, type ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import { hasWebGL } from "./renderer";
import type { CameraOptions, SceneLoader, SceneStatus } from "./scene-types";

/**
 * The WebGL part is a separate chunk that is never rendered on the server (`ssr: false`), so Three.js is only
 * downloaded when a scene is actually near the viewport.
 */
const SceneCanvas = dynamic(() => import("./scene-canvas"), { ssr: false });

export type SceneRootProps = {
  /** Loads the scene module: `() => import("./scenes/hero")`. It default-exports a `SceneFactory`. */
  load: SceneLoader;
  /** Accessible name of the 3D view. */
  label: string;
  /** Still image (REQ-013): shown from the first paint, and kept when WebGL is missing or fails. */
  fallback?: ReactNode;
  className?: string;
  exposure?: number;
  alpha?: boolean;
  camera?: CameraOptions;
  /** Start loading when the scene is within this distance of the viewport (default 300px). */
  rootMargin?: string;
  /** Unmount (and free the GPU context) when the scene is far off-screen again. Default: keep until unmount. */
  releaseWhenFar?: boolean;
  onStatusChange?: (s: SceneStatus) => void;
};

/**
 * One safe way to mount a Three.js scene (REQ-012, REQ-013):
 * mounts near the viewport only, pauses off-screen and in hidden tabs, disposes everything on unmount, falls back to
 * a still image when WebGL is unavailable, and renders a final still frame under reduced motion.
 */
export function SceneRoot({ load, label, fallback, className, exposure, alpha, camera, rootMargin = "300px", releaseWhenFar = false, onStatusChange }: SceneRootProps) {
  const t = useTranslations();
  const [ref, near] = useInView<HTMLDivElement>({ rootMargin, once: !releaseWhenFar });
  const [canvasStatus, setCanvasStatus] = useState<SceneStatus>("loading");

  // `near` is only ever true in the browser, so reading WebGL support during render is safe for SSR.
  const unsupported = near && !hasWebGL();
  const status: SceneStatus = !near ? "idle" : unsupported ? "unsupported" : canvasStatus;

  const onStatus = useCallback(
    (s: SceneStatus) => {
      setCanvasStatus(s);
      onStatusChange?.(s);
    },
    [onStatusChange],
  );

  const ready = status === "ready";
  // Opaque scenes fade in over the still image (no flash of an empty canvas); see-through scenes drop it at once.
  const showFallback = !ready || !alpha;
  const failed = status === "unsupported" || status === "error" || status === "lost";

  return (
    <div ref={ref} className={cn("ui-scene", className)} data-testid="scene-root" data-scene-status={status}>
      {showFallback ? (
        <div className={cn("absolute inset-0 transition-opacity duration-700", ready && "opacity-0")} aria-hidden={ready} data-testid="scene-fallback">
          {fallback}
        </div>
      ) : null}
      {near && !unsupported && status !== "lost" ? (
        <div className={cn("absolute inset-0 transition-opacity duration-700", !ready && "opacity-0")}>
          <SceneCanvas load={load} label={label} exposure={exposure} alpha={alpha} camera={camera} onStatus={onStatus} />
        </div>
      ) : null}
      {status === "loading" ? (
        <span role="status" className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-cream/80 drop-shadow">
          {t("common.ldr3d")}
        </span>
      ) : null}
      {failed ? (
        <span data-testid="scene-caption" className="absolute inset-x-3 bottom-3 rounded-md bg-night/70 px-3 py-1.5 text-center text-xs text-cream">
          {t("scenes.stillL")}
        </span>
      ) : null}
    </div>
  );
}
