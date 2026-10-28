/** Tiny typed wrapper over DOM CustomEvents: the channel between a React section and its scene (both sit under the same element). */
export const emit = <T>(el: EventTarget, name: string, detail?: T) => el.dispatchEvent(new CustomEvent<T>(name, { detail }));

/** Listen for `name` on `el`; returns the remover. */
export function listen<T = undefined>(el: EventTarget, name: string, fn: (detail: T) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<T>).detail);
  el.addEventListener(name, h);
  return () => el.removeEventListener(name, h);
}

/** Design Process section <-> scene (components/sections/home/process.tsx, scenes/process.ts). */
export const P3_STAGE = "p3:stage"; // scene -> section: the stage the scroll reached
export const P3_SET = "p3:set"; // section -> scene: stage chosen by hand (reduced motion / no pinning)
export const P3_RESET = "p3:reset"; // section -> scene: turn back to the start view

/** Walk-through section <-> scene (components/sections/home/walk.tsx, scenes/walk.ts). */
export const WK_ZONE = "wk:zone"; // scene -> section: zone id the scroll walk is in
export const WK_SELECT = "wk:select"; // scene -> section: { type, zone } of the selected piece, or null
export const WK_INSIDE = "wk:inside"; // scene -> section: boolean, free exploration on/off
export const WK_ENTER = "wk:enter"; // section -> scene
export const WK_EXIT = "wk:exit";
export const WK_GOTO = "wk:goto"; // section -> scene: index into ZONES
export const WK_RESET = "wk:reset"; // section -> scene: back to the entrance (free mode)
export const WK_CLOSE = "wk:close"; // section -> scene: clear the selection
