"use client";

import { useSyncExternalStore } from "react";

const BUILD_YEAR = new Date().getFullYear();
const subscribe = () => () => {};

/**
 * Current year for the copyright line. Static pages are built once, so the server value
 * can be stale; on the client the real year is used (hydration keeps the server value
 * first, then updates without a mismatch warning).
 */
export function CurrentYear() {
  const year = useSyncExternalStore(subscribe, () => new Date().getFullYear(), () => BUILD_YEAR);
  return <>{year}</>;
}
