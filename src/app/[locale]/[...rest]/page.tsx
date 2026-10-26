import { notFound } from "next/navigation";

// Catch-all: any unknown path under /en or /ar renders the localized 404 inside the shell.
export default function CatchAll() {
  notFound();
}
