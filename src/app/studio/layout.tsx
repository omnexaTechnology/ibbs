// Second root layout (see Next.js multiple root layouts): the Studio has its own <html>/<body>
// and does NOT load the site's globals.css, fonts or providers, which live in [locale]/layout.tsx.
// Not under [locale] and excluded from the locale proxy (src/proxy.ts matcher).
export default function StudioRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
