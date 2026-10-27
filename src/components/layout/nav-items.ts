/** Main navigation. `key` is a message key in the `nav` namespace. */
export const NAV_ITEMS = [
  { href: "/", key: "navHome" },
  { href: "/about", key: "navAbout" },
  { href: "/projects", key: "navProjects" },
  { href: "/contact", key: "navContact" },
] as const;

export type NavHref = (typeof NAV_ITEMS)[number]["href"];

/**
 * Whether a nav item is active for a locale-less pathname.
 * Home matches only "/"; the others also match their sub-pages, so Projects
 * stays active on /projects/<slug>.
 */
export function isNavActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
