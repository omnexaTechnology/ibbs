import type { StructureResolver } from "sanity/structure";
import { LEAD_ROUTING_ID } from "./lead-id";

/** Desk structure (REQ-002): Projects · Clients · Hero images · Site settings · Lead routing · Leads. */
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
        .title("Clients")
        .id("client")
        .child(
          S.documentTypeList("client")
            .title("Clients")
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
      S.listItem()
        .title("Lead routing (private)")
        .id("leadRouting")
        .child(S.document().schemaType("leadRouting").documentId(LEAD_ROUTING_ID).title("Lead routing (private)")),
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
