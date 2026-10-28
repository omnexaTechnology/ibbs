"use client";

import { useTranslations } from "next-intl";
import { Honeypot, TextField } from "./fields";
import { FormSuccess } from "./form-success";
import { FormAlert, submitButtonClass, type LeadFormProps } from "./request-form";
import { useLeadForm } from "./use-lead-form";

/** Quick "request a call" form: a phone number, optionally a name (REQ-002). */
export function CallForm({ whatsappHref, className }: LeadFormProps) {
  const t = useTranslations("forms");
  const { formRef, status, errors, ready, onSubmit, reset } = useLeadForm("call");
  const err = (field: string) => (errors[field] ? t(`errors.${errors[field]}`) : undefined);

  if (status === "sent") {
    return (
      <div className={className}>
        <FormSuccess body={t("quickDone")} againLabel={t("okAgain")} onAgain={reset} />
      </div>
    );
  }

  return (
    <form ref={formRef} method="post" onSubmit={onSubmit} noValidate data-testid="call-form" data-form-type="call" aria-busy={status === "sending"} className={className}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="cf-name" name="name" maxLength={120} label={t("fName")} autoComplete="name" placeholder={t("phName")} error={err("name")} />
        <TextField id="cf-ph" name="phone" maxLength={40} type="tel" label={t("fPhone")} required autoComplete="tel" placeholder={t("phPhone")} error={err("phone")} />
      </div>
      <Honeypot />
      <div className="mt-5 flex flex-col gap-4">
        {status === "error" && <FormAlert message={t("fFailed")} whatsappHref={whatsappHref} />}
        <div>
          <button type="submit" disabled={!ready || status === "sending"} className={submitButtonClass}>
            {status === "sending" ? t("sending") : t("sendQuick")}
          </button>
        </div>
      </div>
    </form>
  );
}
