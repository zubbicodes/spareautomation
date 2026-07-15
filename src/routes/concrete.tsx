import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shopify/CollectionPage";
import { getCollection, getLatestProducts } from "@/lib/api/shopify.functions";
import concrete from "@/assets/concrete-plant.jpg";
import { SITE } from "@/lib/site";

const collectionHandle = "concrete";
const productLines = [
  { slug: "aggregate-feeding", label: "Aggregate Feeding", keywords: ["aggregate", "feeder", "feed", "hopper", "belt", "conveyor"] },
  { slug: "cement-material-silos", label: "Cement / Material Silos", keywords: ["cement", "material", "silo", "filter", "aerator"] },
  { slug: "additive-system", label: "Additive System", keywords: ["additive", "admixture", "chemical", "dosing"] },
  { slug: "water-controls", label: "Water Controls", keywords: ["water", "meter", "pump", "valve", "flow"] },
  { slug: "air-controls", label: "Air Controls", keywords: ["air", "pneumatic", "compressor", "valve", "actuator"] },
  { slug: "automation-controls", label: "Automation Controls", keywords: ["automation", "control", "plc", "sensor", "panel"] },
];

export const Route = createFileRoute("/concrete")({
  validateSearch: (search: Record<string, unknown>) => ({
    line: typeof search.line === "string" ? search.line : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Concrete Spares | Spares Automation" },
      {
        name: "description",
        content: "Product range for ready-mix concrete plant spares.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/concrete` }],
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
  component: ConcretePage,
});

function ConcretePage() {
  const { collection, products } = Route.useLoaderData();
  const { line } = Route.useSearch();

  return (
    <CollectionPage
      eyebrow="Ready-Mix / Concrete"
      title="READY-MIX / CONCRETE"
      accent="amber"
      image={concrete}
      imageAlt="Ready-mix concrete plant"
      collection={collection}
      fallbackProducts={products}
      expectedHandle={collectionHandle}
      productLines={productLines}
      activeLine={line}
    />
  );
}
