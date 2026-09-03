import { getCatalogueSearch } from "@/lib/catalog";

/**
 * Navigation destinations are locked by the content schema, so a CMS entry only
 * needs splitting back into a route plus its catalogue search parameters. That
 * keeps client-side routing and the canonical catalogue URLs intact while
 * editors control labels, order and visibility.
 */
export function navTarget(to: string) {
  const [path, query] = to.split("?");
  const category = query ? new URLSearchParams(query).get("category") : null;
  if (path === "/products") {
    return { to: path, search: getCatalogueSearch(category ?? "all") } as const;
  }
  return { to: path, search: undefined } as const;
}
