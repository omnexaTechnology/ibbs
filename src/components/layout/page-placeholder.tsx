/**
 * Temporary body for routes whose real content arrives in FEAT-003.
 * Renders inside the shell (header/footer come from the locale layout).
 */
export function PagePlaceholder({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-[1280px] px-8 py-24">
      <h1 data-testid="page-title" className="text-5xl font-semibold">
        {title}
      </h1>
      {children && <div className="mt-6 text-muted">{children}</div>}
    </section>
  );
}
