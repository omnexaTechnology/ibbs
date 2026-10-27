"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useLocale } from "next-intl";
import { leadSchema, toFieldErrors, type FieldErrors, type FormType } from "@/lib/validation/lead";

const subscribeNever = () => () => {};

export type FormStatus = "idle" | "sending" | "sent" | "error";

/**
 * Shared behaviour of the three forms: validate with the same schema as the server, post to
 * /api/leads, keep the status, focus the first invalid field. Fields are uncontrolled (read from
 * FormData on submit), so there is no per-keystroke re-render.
 */
export function useLeadForm(formType: FormType) {
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const startedAt = useRef(0);
  /** False until hydration: before that a native submit would fall back to a form post (F4-01). */
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [errorRun, setErrorRun] = useState(0);

  // The timing check measures from mount (and again after "send another"), never from a validation error (F4-02).
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // After errors are rendered, move focus to the first invalid control (document order).
  useEffect(() => {
    if (errorRun === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errorRun]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "sending") return;
      const data = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = {
        formType,
        locale,
        pageUrl: window.location.pathname,
        elapsedMs: Date.now() - startedAt.current,
      };
      for (const [key, value] of data.entries()) if (typeof value === "string") payload[key] = value;

      const parsed = leadSchema.safeParse(payload);
      if (!parsed.success) {
        setErrors(toFieldErrors(parsed.error));
        setStatus("idle");
        setErrorRun((n) => n + 1);
        return;
      }

      setErrors({});
      setStatus("sending");
      try {
        const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) {
          setStatus("sent");
          return;
        }
        // The server can still reject (rules we did not catch): show its field errors inline.
        const body = (await res.json().catch(() => null)) as { error?: string; fields?: FieldErrors } | null;
        if (res.status === 400 && body?.fields && Object.keys(body.fields).length) {
          setErrors(body.fields);
          setStatus("idle");
          setErrorRun((n) => n + 1);
          return;
        }
        setStatus("error");
      } catch {
        setStatus("error");
      }
    },
    [formType, locale, status],
  );

  const reset = useCallback(() => {
    setErrors({});
    setStatus("idle");
    startedAt.current = Date.now();
  }, []);

  return { formRef, status, errors, ready, onSubmit, reset };
}
