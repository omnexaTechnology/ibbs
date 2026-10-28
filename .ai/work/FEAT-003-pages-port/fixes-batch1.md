# FEAT-003 batch 1 review fixes

| ID | Status | What was done |
|---|---|---|
| B1-01 | fixed | New Three-free `src/three/support.ts` (`hasWebGL`, `resetWebGLSupportCache`, `prefersReducedMotion`, `qualityFor`, `detectQuality`, Quality types). `renderer.ts` re-exports them; `scene-root.tsx` imports only `support` and `import type`; `scene-canvas`/`scene-types`/tests import from `support`. Guards: vitest (`scene.test.tsx`) mocks `three` and `./renderer` to throw and imports `scene-root` (verified it fails when the import is reverted); e2e `three.spec.ts` asserts no downloaded script contains `WebGLRenderer` while status is `idle`. |
| B1-02 | fixed | `touch-pan-y` on the carousel root. e2e CDP touch-drag test in `three.spec.ts` (fixture carousel, 390 px). |
| B1-03 | fixed | `HotspotImage` got `mirror` (default false): flips image layer (`-scale-x-100` wrapper) and pins together; `dir` only sets tooltip text direction. Fixture passes `mirror={rtl}` (stands in for the hero); `project-overview.tsx` passes only `dir`, so project pins no longer move in AR. e2e project test now expects equal x in EN/AR. Spec BR-002 wording clarified. |
| B1-04 | fixed | Lightbox root `tabIndex={-1}`. |
| B1-05 | fixed | Tooltip ids prefixed with `useId()`; test for two instances. |
| B1-06 | fixed | `SceneRoot` resets `canvasStatus` to `loading` when `near` turns false (derived-state-in-render); far/near/far/near test. |
| B1-07 | fixed | `src/lib/gsap-state.ts` flag (no GSAP import), set by `lib/gsap.ts`; `useGsapRefresh` returns early (both effects) unless GSAP is already loaded. Test added. |
| B1-08 | fixed | `hasWebGL` probes `webgl2` only. |
| B1-09 | fixed | Low-end is `deviceMemory < 4`; test that 4 is not low-end. Real-device check still open (T-010). `?quality=` not added. |
| B1-10 | noted | Review notes added to `tasks/T-006.md` and `tasks/T-008.md`. |
| B1-11 | fixed | `toneMapping` option on `RendererOptions`, `SceneCanvas`, `SceneRoot` (default ACES). `shadows` option not added (quality already governs it). |
| B1-12 | fixed | `legacyPointLight` uses decay 0 when distance or decay is 0; test. |
| B1-13 | fixed | (a) `SceneCanvas` keeps the latest `onStatus` in a ref and updates the canvas `aria-label` in an effect. (b) `useSwipe` returns `onClickCapture` that swallows the click ending a swipe; lightbox test. |

Note on commits: B1-06, B1-12 and B1-13a landed inside the B1-01 commit because they share files in `src/three`.
