# FEAT-001 — Impact analysis

Date: 2026-10-26. Greenfield: no application code exists, so "impact" = what gets created, what later items depend on, and risks.

## Summary
Creates the Next.js app every other item builds on: routing per locale, design tokens, theme, shell (header/footer/WhatsApp), transitions and cursor. Its contracts (locale routing, `SiteSettings` type, layout slots) are consumed by FEAT-002/003/004.

## Affected areas
| Area | Effect |
|---|---|
| Repo / tooling | New repo `ibss-web`: Next.js 16, React 19, TS strict, Tailwind 4, shadcn/ui (new-york, lucide), ESLint 9, Vitest, Playwright — same set as `Omnexa-academy-client` (next 16.1, next-intl 4, tailwind 4, zod 4, RHF 7). |
| Routing | `app/[locale]/…` for the 7 views; `/studio` and `/api/*` stay outside `[locale]`. |
| i18n | next-intl 4 with URL prefix (`/en`, `/ar`). **Differs from Omnexa Learn**, which picks the locale from a `NEXT_LOCALE` cookie (`src/i18n/request.ts`). The URL prefix is needed for SEO and hreflang (FEAT-005). |
| Request proxy | Next 16 names the request interceptor `proxy.ts` (was `middleware.ts`). Its matcher must exclude `/studio`, `/api`, `_next`, static files. |
| Styling | Design `:root` tokens → CSS variables in `app/globals.css`, mapped into Tailwind 4 `@theme`; `.site` light/dark variables preserved. |
| Theme | next-themes (as in Omnexa Learn) with `class` strategy → no flash. |
| Data contract | `SiteSettings` TS type + `getSiteSettings()` returning design defaults; FEAT-002 swaps the implementation to Sanity without changing callers. |
| Deployment | New Vercel project on Omnexa's account; preview per branch. `ibss-demo` project is untouched. |

## Files/modules likely involved
`package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`, `proxy.ts`, `src/i18n/{routing,request,navigation}.ts`, `messages/{en,ar}.json`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/{page,about,projects,projects/[slug],contact,privacy,terms}/page.tsx`, `src/app/globals.css`, `src/components/layout/{header,mobile-menu,footer,whatsapp-button,page-transition,custom-cursor,lang-switch,theme-toggle}.tsx`, `src/hooks/use-reduced-motion.ts`, `src/lib/site-settings.ts`, `src/types/site-settings.ts`, `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`.

## Dependencies
- None upstream. Blocks FEAT-002 (Studio mount, settings contract), FEAT-003 (shell, routes, tokens), FEAT-004 (layout, messages).
- Git repo + Vercel project need access to the `omnexaTechnology` org and Omnexa's Vercel team (default answers to Q3/Q4).

## Risks
- **R1** Page transition (`go()` close → swap → open, ~2.4s) must work with App Router navigation; needs a client wrapper that delays `router.push` until the close animation ends, and must not block back/forward. Medium.
- **R2** Arabic text in `T` is extensive (~120 keys + section copy); extraction must be complete or AR pages fall back silently. Mitigation: typed messages + a test that `en` and `ar` have the same keys.
- **R3** Font licence comments: Montserrat/Alexandria are OFL via Google Fonts — `next/font/google` self-hosts them, fine.

## Unaffected areas
`ibss-demo` folder and its Vercel project (demo stays live until launch).

## Open questions
Non-blocking only (see `questions.md`): default locale, git host, domain.

## Recommended implementation order
Scaffold → i18n + fonts → tokens + theme → shell → transitions + cursor → route stubs + CI/preview.

IMPACT STATUS: READY_FOR_PLAN
