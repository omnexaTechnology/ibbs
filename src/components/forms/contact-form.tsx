"use client";

import { RequestForm, type LeadFormProps } from "./request-form";

/** Contact page form (`f-*` in the design). Not wired into the page yet (FEAT-004/T-003). */
export function ContactForm(props: LeadFormProps) {
  return <RequestForm formType="contact" {...props} />;
}
