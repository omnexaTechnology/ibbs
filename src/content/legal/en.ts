/**
 * Legal pages content, English. Typed TS module instead of MDX (no @next/mdx / remark dependencies for a few short,
 * structured sections; the page derives the table of contents from the same data).
 *
 * DRAFT: this is the design's neutral placeholder wording, pending approval by the client's legal
 * counsel (FEAT-005 Q3). Do not treat as final legal text.
 */
import type { LegalDoc } from "./types";

export const enLegal: Record<"privacy" | "terms", LegalDoc> = {
  "privacy": {
    "title": "Privacy policy",
    "lead": "How IBSS Innovations collects, uses and protects the information you share with us through this website.",
    "sections": [
      {
        "heading": "Information we collect",
        "body": [
          "When you contact us or request a proposal, we collect the details you choose to provide, such as your name, company, mobile number, email, type of space, estimated area and project details."
        ]
      },
      {
        "heading": "How we use it",
        "body": [
          "We use this information only to respond to your enquiry, discuss your project and prepare a suitable proposal."
        ]
      },
      {
        "heading": "Sharing",
        "body": [
          "We do not sell your information. It is shared only with team members or service providers who need it to handle your request, or when required by law."
        ]
      },
      {
        "heading": "Retention and security",
        "body": [
          "We keep your information only as long as needed for the purpose it was collected and apply reasonable measures to protect it."
        ]
      },
      {
        "heading": "Your choices",
        "body": [
          "You can ask us at any time to update or delete the information you have shared with us."
        ]
      },
      {
        "heading": "Updates to this policy",
        "body": [
          "We may update this policy from time to time. The latest version will always be available on this page."
        ]
      }
    ]
  },
  "terms": {
    "title": "Terms of use",
    "lead": "The terms that apply when you browse the IBSS Innovations website.",
    "sections": [
      {
        "heading": "Using this website",
        "body": [
          "This website presents IBSS Innovations, its work and its services. By using it, you agree to these terms."
        ]
      },
      {
        "heading": "Content and ownership",
        "body": [
          "Text, images, drawings and the IBSS Innovations name and logo belong to IBSS Innovations and may not be reused without written permission."
        ]
      },
      {
        "heading": "Project information",
        "body": [
          "Project descriptions on this website are for presentation. The scope, timeline and cost of any project are confirmed only in a written agreement."
        ]
      },
      {
        "heading": "Links to other sites",
        "body": [
          "Links to external services such as WhatsApp or maps are provided for convenience; their own terms apply."
        ]
      },
      {
        "heading": "Governing law",
        "body": [
          "These terms are governed by the laws of the Kingdom of Saudi Arabia."
        ]
      }
    ]
  }
};
