import * as THREE from "three";

/**
 * Light intensities in the design were authored for Three r149, which scaled every light by PI ("legacy" lighting).
 * r155+ dropped that, so authored values must be multiplied by PI to look the same.
 *
 * Ambient, hemisphere and directional lights match exactly. Point lights also change their distance falloff:
 * r149 used `(1 - d / distance) ^ decay`, r186 uses `1 / d ^ decay` windowed by `(1 - (d / distance) ^ 4) ^ 2`.
 * The curves differ, so `legacyPointFactor` matches the two at a reference distance (default 40% of the light's
 * range, where most of the lit surface sits) and the scene should be eyeballed afterwards.
 */
export const LEGACY_LIGHT_SCALE = Math.PI;

/** Intensity to give an ambient, hemisphere or directional light so it matches the design value. */
export const legacyIntensity = (designIntensity: number) => designIntensity * LEGACY_LIGHT_SCALE;

/**
 * Multiplier from the design intensity of a point/spot light (with `distance` > 0 and `decay`) to the r186 intensity.
 * Animated lights multiply their per-frame design intensity by this once.
 */
export function legacyPointFactor(distance: number, decay: number, ref = 0.4): number {
  // No range (distance 0): the design falloff was constant, so only the PI scale applies (use decay 0).
  if (distance <= 0) return LEGACY_LIGHT_SCALE;
  const d0 = ref * distance;
  const oldFalloff = Math.pow(1 - ref, decay);
  const newFalloff = (1 / Math.max(Math.pow(d0, decay), 0.01)) * Math.pow(1 - Math.pow(ref, 4), 2);
  return (LEGACY_LIGHT_SCALE * oldFalloff) / newFalloff;
}

/** A point light that matches the design's `new PointLight(color, intensity, distance, decay)`. */
export function legacyPointLight(color: THREE.ColorRepresentation, designIntensity: number, distance: number, decay: number) {
  // r149: no range or no decay meant no falloff, so keep r186 from applying inverse-square (decay 0).
  return new THREE.PointLight(color, designIntensity * legacyPointFactor(distance, decay), distance, distance > 0 && decay > 0 ? decay : 0);
}
