"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { HONEYPOT_FIELD } from "@/lib/validation/lead";
import { cn } from "@/lib/utils";

type FieldProps = {
  id: string;
  label: string;
  /** Already-localized error text; when set the control is marked invalid. */
  error?: string;
  required?: boolean;
};

const control =
  "w-full rounded-md border border-line bg-surface px-3.5 py-3 text-[15px] text-text outline-none transition-colors placeholder:text-muted/60 focus-visible:border-blue focus-visible:ring-2 focus-visible:ring-blue/30 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20";

function aria(id: string, error?: string, required?: boolean) {
  return { "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-err` : undefined, "aria-required": required || undefined } as const;
}

function Shell({ id, label, error, required, className, children }: FieldProps & { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-text">
        {label}
        {required && (
          <span className="ms-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} className="text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = FieldProps & { className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

/** Single-line input. Email/phone/number values are always LTR, even inside an Arabic page. */
export function TextField({ id, label, error, required, className, ...input }: TextFieldProps) {
  const ltr = input.type === "email" || input.type === "tel" || input.inputMode === "numeric";
  return (
    <Shell id={id} label={label} error={error} required={required} className={className}>
      <input id={id} className={cn(control, ltr && "text-start")} dir={ltr ? "ltr" : undefined} {...aria(id, error, required)} {...input} />
    </Shell>
  );
}

type TextAreaFieldProps = FieldProps & { className?: string } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className">;

export function TextAreaField({ id, label, error, required, className, ...area }: TextAreaFieldProps) {
  return (
    <Shell id={id} label={label} error={error} required={required} className={className}>
      <textarea id={id} rows={5} className={cn(control, "resize-y")} {...aria(id, error, required)} {...area} />
    </Shell>
  );
}

type SelectFieldProps = FieldProps & { className?: string; options: { value: string; label: string }[]; placeholder: string } & Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "id" | "className"
  >;

export function SelectField({ id, label, error, required, className, options, placeholder, ...select }: SelectFieldProps) {
  return (
    <Shell id={id} label={label} error={error} required={required} className={className}>
      <select id={id} className={control} defaultValue="" {...aria(id, error, required)} {...select}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

/**
 * Honeypot (REQ-006): invisible and unreachable for people and assistive tech; bots that fill every
 * input trip it. Named "hp_extra" in the payload (not a real-world field name, so password managers leave it alone). Not display:none, which some bots skip.
 */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -z-10 h-0 w-0 overflow-hidden opacity-0">
      <label>
        Leave this empty
        <input
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
        />
      </label>
    </div>
  );
}
