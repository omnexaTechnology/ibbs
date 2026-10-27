"use client";

import { RequestForm, type LeadFormProps } from "./request-form";

/** Contact page form (`f-*` in the design). */
export function ContactForm(props: LeadFormProps) {
  return <RequestForm formType="contact" {...props} />;
}
