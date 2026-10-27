import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

// The Studio is a client-side app; the page itself is static.
export const dynamic = "force-static";

// `metadata` is `{ robots: "noindex", referrer: "same-origin" }`, `viewport` the Studio default.
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
