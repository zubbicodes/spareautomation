import { createFileRoute, redirect } from "@tanstack/react-router";

import { getCatalogueSearch, getCatalogFilterHandle } from "@/lib/catalog";

export const Route = createFileRoute("/asphalt")({
  validateSearch: (search: Record<string, unknown>) => ({
    line: typeof search.line === "string" ? search.line : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/products",
      search: getCatalogueSearch(getCatalogFilterHandle("asphalt", search.line)),
      replace: true,
    });
  },
});
