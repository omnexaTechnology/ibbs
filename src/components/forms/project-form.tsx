"use client";

import { RequestForm, type LeadFormProps } from "./request-form";

/** "Planning a similar project?" form on the project page (`pf-*` in the design), with its heading. */
export function ProjectForm(props: LeadFormProps) {
  return <RequestForm formType="project" heading {...props} />;
}
