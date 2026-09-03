import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shopify/CollectionPage";
import { getLatestProducts } from "@/lib/api/shopify.functions";
import automation from "@/assets/Automation pic.jpg";
import { useContent } from "@/lib/content/ContentContext";
import { getPublishedContent } from "@/lib/content/content.functions";
import { contentPageHead } from "@/lib/seo";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ deps }) => {
    const [products, content] = await Promise.all([
      getLatestProducts({ data: { first: 48, query: deps.q ? deps.q : undefined } }),
      getPublishedContent(),
    ]);
    return { products, q: deps.q, site: content.site, seo: content.functional.search.seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(
      loaderData?.seo
        ? {
            ...loaderData.seo,
            title: loaderData.q ? `Search results for ${loaderData.q}` : loaderData.seo.title,
          }
        : undefined,
      loaderData?.site,
      "/search",
      {
        title: "Search Products",
        description:
          "Search the Spares Automation industrial parts catalogue by product name, part number, brand, or equipment reference.",
      },
      { noIndex: true },
    ),
  component: SearchPage,
});

function SearchPage() {
  const { products, q } = Route.useLoaderData();
  const { functional } = useContent();
  const copy = functional.search;

  return (
    <CollectionPage
      eyebrow={copy.eyebrow}
      title={q ? `${copy.sectionTitle || "RESULTS"} / ${q}` : copy.title}
      image={automation}
      imageAlt="Industrial automation search"
      collection={null}
      fallbackProducts={products}
      expectedHandle="search"
    />
  );
}
