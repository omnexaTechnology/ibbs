"use client";

import { useEffect, useRef } from "react";

/** Confirmation after a successful send. Takes focus so keyboard and screen-reader users land on it. */
export function FormSuccess({ title, body, againLabel, onAgain }: { title?: string; body: string; againLabel: string; onAgain: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div ref={ref} tabIndex={-1} role="status" data-testid="form-success" className="flex flex-col items-center gap-3 py-8 text-center outline-none">
      <svg viewBox="0 0 110 110" aria-hidden="true" className="size-20 text-green" fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="55" cy="55" r="50" />
        <path d="M33 56l15 15 30-31" />
      </svg>
      {title && <h3 className="text-xl font-semibold">{title}</h3>}
      <p className="max-w-md text-muted">{body}</p>
      <button type="button" onClick={onAgain} className="mt-2 rounded-full border border-line px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent">
        {againLabel}
      </button>
    </div>
  );
}
