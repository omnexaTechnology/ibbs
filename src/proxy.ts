import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Next 16: the request interceptor is `proxy` (formerly `middleware`).
// Redirects `/` and un-prefixed paths to /en or /ar (browser language, else en).
export const proxy = createMiddleware(routing);

export const config = {
  // Skip: /api, /studio (Sanity), /_next, /_vercel, and anything with a file extension.
  matcher: ["/((?!api|studio|_next|_vercel|.*\..*).*)"],
};
