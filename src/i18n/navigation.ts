// Locale-aware navigation for the app.
// `Link` is transition-aware: internal clicks play the page transition (REQ-010).
// Use `PlainLink` (or the base module) for links that must not transition, e.g. the language switch.
export { Link } from "@/components/layout/transition-link";
export { Link as PlainLink, redirect, usePathname, useRouter, getPathname } from "./navigation-base";
