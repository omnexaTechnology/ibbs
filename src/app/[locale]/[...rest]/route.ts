import { hasLocale } from "next-intl";
import { getDirection, routing } from "@/i18n/routing";
import ar from "../../../../messages/ar.json";
import en from "../../../../messages/en.json";

// Unknown paths under /en and /ar.
//
// Why a route handler and not `notFound()` + [locale]/not-found.tsx: because the root layout
// lives under the dynamic [locale] segment, Next answers a thrown notFound() with its blank
// client-rendered error shell (<html id="__next_error__">, no lang, empty body), which is
// invisible without JavaScript (verified with Turbopack and webpack, with and without
// global-not-found). A route handler returns a complete localized HTML document with a real
// 404 status. Pages that call notFound() (e.g. a missing project in FEAT-003) still end up
// in [locale]/not-found.tsx, rendered by the client.
const MESSAGES = { en: en.notFound, ar: ar.notFound };

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

function page(locale: "en" | "ar") {
  const t = MESSAGES[locale];
  const dir = getDirection(locale);
  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escape(t.title)} | ${escape(en.common.brand)}</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F5F2EC;color:#1E2E5A;font-family:system-ui,sans-serif;text-align:center;padding:32px}
@media (prefers-color-scheme:dark){body{background:#0B1120;color:#F5F2EC}}
.c{font-size:14px;font-weight:600;letter-spacing:.2em;color:#2E6EB5}
h1{font-size:clamp(32px,6vw,56px);margin:12px 0}
p{margin:0 0 28px;opacity:.75;font-size:18px}
a{display:inline-block;padding:14px 26px;border-radius:999px;background:#1E2E5A;color:#F5F2EC;text-decoration:none;font-weight:600}
</style>
</head>
<body data-testid="not-found">
<main>
<p class="c">${escape(t.code)}</p>
<h1>${escape(t.title)}</h1>
<p>${escape(t.body)}</p>
<a href="/${locale}">${escape(t.home)}</a>
</main>
</body>
</html>`;
}

async function respond(_req: Request, ctx: { params: Promise<{ locale: string }> }) {
  const { locale } = await ctx.params;
  const l = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  return new Response(page(l), {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export const GET = respond;
export const HEAD = respond;
