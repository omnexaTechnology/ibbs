import type { StructureResolver } from "sanity/structure";

/** Desk structure (REQ-002): Projects · Hero images · Site settings · Leads. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Projects")
        .id("project")
        .child(
          S.documentTypeList("project")
            .title("Projects")
            .defaultOrdering([{ field: "order", direction: "asc" }]),
        ),
      S.listItem()
        .title("Hero images")
        .id("heroSlides")
        .child(S.document().schemaType("heroSlides").documentId("heroSlides").title("Hero images")),
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings").title("Site settings")),
      S.divider(),
      S.listItem()
        .title("Leads")
        .id("lead")
        .child(
          S.documentTypeList("lead")
            .title("Leads (newest first)")
            .defaultOrdering([{ field: "createdAt", direction: "desc" }]),
        ),
    ]);
