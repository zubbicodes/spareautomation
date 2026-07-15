import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shopify/CollectionPage";
import { getLatestProducts } from "@/lib/api/shopify.functions";
import automation from "@/assets/cat-automation.jpg";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ deps }) => ({
    products: await getLatestProducts({
      data: {
        first: 48,
        query: deps.q ? deps.q : undefined,
      },
    }),
    q: deps.q,
  }),
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.q ? `Search results for ${loaderData.q} | Spares Automation` : "Search Products | Spares Automation" }, { name: "description", content: "Search the Spares Automation industrial parts catalogue by product name, part number, brand, or equipment reference." }, { name: "robots", content: "noindex, follow" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { products, q } = Route.useLoaderData();

  return (
    <CollectionPage
      eyebrow="Product Search"
      title={q ? `RESULTS / ${q}` : "CATALOGUE / SEARCH"}
      image={automation}
      imageAlt="Industrial automation search"
      collection={null}
      fallbackProducts={products}
      expectedHandle="search"
    />
  );
}
