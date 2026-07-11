import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shopify/CollectionPage";
import { getCollection, getLatestProducts } from "@/lib/api/shopify.functions";
import asphalt from "@/assets/asphalt-plant.jpg";
import { SITE } from "@/lib/site";

const collectionHandle = "asphalt";
const productLines = [
  { slug: "feeders", label: "Feeders", keywords: ["feeder", "feed", "conveyor", "belt", "scraper"] },
  { slug: "burner-drying", label: "Burner / Drying", keywords: ["burner", "dryer", "drying", "nozzle", "flame"] },
  { slug: "bitumen", label: "Bitumen", keywords: ["bitumen", "pump", "valve", "hose"] },
  { slug: "hot-stone-silos", label: "Hot Stone / Silos", keywords: ["hot", "stone", "silo", "storage", "bin"] },
  { slug: "baghouse", label: "Baghouse", keywords: ["baghouse", "filter", "bag", "dust"] },
  { slug: "mixing-tower", label: "Mixing Tower", keywords: ["mixing", "mixer", "tower", "liner", "drum"] },
];

export const Route = createFileRoute("/asphalt")({
  validateSearch: (search: Record<string, unknown>) => ({
    line: typeof search.line === "string" ? search.line : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Asphalt Spares | Spares Automation" },
      {
        name: "description",
        content: "Product range for asphalt and blacktop plant spares.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/asphalt` }],
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
  component: AsphaltPage,
});

function AsphaltPage() {
  const { collection, products } = Route.useLoaderData();
  const { line } = Route.useSearch();

  return (
    <CollectionPage
      eyebrow="Catalogue / Heavy Plant / Vertical 01"
      title="ASPHALT / BLACKTOP"
      image={asphalt}
      imageAlt="Asphalt plant"
      intro="Specialist procurement of bituminous mixing plant components, from burner systems to drum mixer seals."
      collection={collection}
      fallbackProducts={products}
      expectedHandle={collectionHandle}
      productLines={productLines}
      activeLine={line}
    />
  );
}
