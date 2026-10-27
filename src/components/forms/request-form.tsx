"use client";

import { useTranslations } from "next-intl";
import { SPACE_TYPE_KEYS, type FormType } from "@/lib/validation/lead";
import { Honeypot, SelectField, TextAreaField, TextField } from "./fields";
import { FormSuccess } from "./form-success";
import { useLeadForm } from "./use-lead-form";

export type LeadFormProps = {
  /** wa.me link from site settings (whatsappHref()); null/undefined hides the fallback link. */
  whatsappHref?: string | null;
  className?: string;
};

export const submitButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

/** Error banner (role=alert) with the WhatsApp fallback (AC-004). */
export function FormAlert({ message, whatsappHref }: { message: string; whatsappHref?: string | null }) {
  const t = useTranslations("forms");
  return (
    <div role="alert" data-testid="form-alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <p>{message}</p>
      {whatsappHref && (
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" data-testid="form-whatsapp" className="mt-2 inline-block font-semibold underline">
          {t("sendWa")}
        </a>
      )}
    </div>
  );
}

/** Full enquiry form (name, company, email, phone, space type, area, message) used by the contact and project forms. */
export function RequestForm({ formType, whatsappHref, className, heading }: LeadFormProps & { formType: Extract<FormType, "contact" | "project">; heading?: boolean }) {
  const t = useTranslations("forms");
  const { formRef, status, errors, onSubmit, reset } = useLeadForm(formType);
  const prefix = formType === "contact" ? "f" : "pf";
  const err = (field: string) => (errors[field] ? t(`errors.${errors[field]}`) : undefined);
  const hasErrors = Object.keys(errors).length > 0;

  if (status === "sent") {
    return (
      <div className={className}>
        <FormSuccess title={t("okTitle")} body={t("okBody")} againLabel={t("okAgain")} onAgain={reset} />
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate data-testid={`${formType}-form`} data-form-type={formType} aria-busy={status === "sending"} className={className}>
      {heading && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-link">{t("formEyebrow")}</p>
          <h2 className="mt-1 text-2xl font-semibold">{t("formTitle")}</h2>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id={`${prefix}-name`} name="name" label={t("fName")} required autoComplete="name" placeholder={t("phName")} error={err("name")} />
        <TextField id={`${prefix}-ph`} name="phone" type="tel" label={t("fPhone")} required autoComplete="tel" placeholder={t("phPhone")} error={err("phone")} />
        <TextField id={`${prefix}-em`} name="email" type="email" label={t("fEmail")} autoComplete="email" placeholder="example@company.com" error={err("email")} />
        <TextField id={`${prefix}-co`} name="company" label={t("fCompany")} autoComplete="organization" placeholder={t("phCo")} error={err("company")} />
        <SelectField
          id={`${prefix}-type`}
          name="spaceType"
          label={t("fType")}
          placeholder={t("fSelect")}
          options={SPACE_TYPE_KEYS.map((key) => ({ value: key, label: t(`spaceTypes.${key}`) }))}
          error={err("spaceType")}
        />
        <TextField id={`${prefix}-area`} name="area" label={t("fArea")} inputMode="numeric" placeholder="1200" error={err("area")} />
        <TextAreaField id={`${prefix}-msg`} name="message" label={t("fMsg")} placeholder={t("fMsgPh")} className="sm:col-span-2" error={err("message")} />
      </div>
      <Honeypot />
      <div className="mt-6 flex flex-col gap-4">
        {status === "error" ? <FormAlert message={t("fFailed")} whatsappHref={whatsappHref} /> : hasErrors && <FormAlert message={t("fInvalid")} />}
        <div>
          <button type="submit" disabled={status === "sending"} className={submitButtonClass}>
            {status === "sending" ? t("sending") : t("send")}
          </button>
        </div>
      </div>
    </form>
  );
}
