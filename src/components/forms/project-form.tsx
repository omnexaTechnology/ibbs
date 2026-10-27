"use client";

import { RequestForm, type LeadFormProps } from "./request-form";

/** "Planning a similar project?" form on the project page (`pf-*` in the design). The page slot renders the heading (R3-01). */
export function ProjectForm(props: LeadFormProps) {
  return <RequestForm formType="project" {...props} />;
}
