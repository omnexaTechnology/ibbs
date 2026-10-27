"use client";

/**
 * Last-resort boundary for errors in the root (locale) layout, e.g. site settings that cannot be
 * read right after a publish (review R-04). It replaces the layout, so it brings its own <html>,
 * has no providers and does not know the locale: both languages are shown.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "6rem 2rem", maxWidth: 640 }}>
        <title>IBSS Innovations</title>
        <div role="alert">
          <h1>Something went wrong</h1>
          <p>We could not load this page right now. Please try again in a moment.</p>
          <div dir="rtl" lang="ar">
            <h2>حدث خطأ ما</h2>
            <p>تعذّر تحميل هذه الصفحة الآن. يرجى المحاولة مرة أخرى بعد قليل.</p>
          </div>
          <button type="button" onClick={() => retry()} style={{ fontSize: 16, padding: "0.75rem 1.5rem", cursor: "pointer" }}>
            Try again / إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
