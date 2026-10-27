import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Plain locale-aware wrappers around next/link and next/navigation (no page transition).
// App code should import from "@/i18n/navigation", whose `Link` plays the page transition.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
