/** Set by `lib/gsap.ts` when GSAP is loaded. Lives apart so checking it never pulls GSAP in (B1-07). */
let loaded = false;
export const markGsapLoaded = () => {
  loaded = true;
};
export const isGsapLoaded = () => loaded;
/** Test hook. */
export const resetGsapLoaded = () => {
  loaded = false;
};
