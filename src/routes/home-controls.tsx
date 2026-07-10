import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shopify/CollectionPage";
import { getCollection, getLatestProducts } from "@/lib/api/shopify.functions";
import homeImg from "@/assets/cat-home.jpg";
import { SITE } from "@/lib/site";

const collectionHandle = "home-controls";
const productLines = [
  { slug: "relays", label: "Relays", keywords: ["relay", "module"] },
  { slug: "sensors", label: "Sensors", keywords: ["sensor", "temperature", "hvac"] },
  { slug: "power-supplies", label: "Power Supplies", keywords: ["power", "supply", "24v", "din"] },
];

export const Route = createFileRoute("/home-controls")({
  validateSearch: (search: Record<string, unknown>) => ({
    line: typeof search.line === "string" ? search.line : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Home Controls | Spares Automation" },
      {
        name: "description",
        content: "Product range for home controls and automation products.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/home-controls` }],
  }),
  loader: async () => {
    const collection = await getCollection({ data: { handle: collectionHandle, first: 48 } });
    const products = collection
      ? []
      : await getLatestProducts({
          data: { first: 48, query: `tag:'collection:${collectionHandle}'` },
        });
    return { collection, products };
  },
  component: HomeControlsPage,
});

function HomeControlsPage() {
  const { collection, products } = Route.useLoaderData();
  const { line } = Route.useSearch();

  return (
    <CollectionPage
      eyebrow="Catalogue / Systems / Vertical 04"
      title="HOME / CONTROLS"
      image={homeImg}
      imageAlt="Home controls"
      intro="Advanced automation for residential and light commercial environments."
      collection={collection}
      fallbackProducts={products}
      expectedHandle={collectionHandle}
      productLines={productLines}
      activeLine={line}
    />
  );
}
