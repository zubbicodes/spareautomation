import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shopify/CollectionPage";
import { getCollection, getLatestProducts } from "@/lib/api/shopify.functions";
import packing from "@/assets/cat-packing.jpg";
import { SITE } from "@/lib/site";

const collectionHandle = "packing";
const productLines = [
  { slug: "sealers", label: "Sealers", keywords: ["sealer", "seal", "heating element"] },
  { slug: "rollers", label: "Rollers", keywords: ["roller", "bearing"] },
  { slug: "belts", label: "Belts", keywords: ["belt", "timing", "drive"] },
  { slug: "conveyors", label: "Conveyors", keywords: ["conveyor", "transfer"] },
];

export const Route = createFileRoute("/packing")({
  validateSearch: (search: Record<string, unknown>) => ({
    line: typeof search.line === "string" ? search.line : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Packing Machinery Spares | Spares Automation" },
      {
        name: "description",
        content: "Product range for packing machinery spares.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/packing` }],
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
  component: PackingPage,
});

function PackingPage() {
  const { collection, products } = Route.useLoaderData();
  const { line } = Route.useSearch();

  return (
    <CollectionPage
      eyebrow="Catalogue / Logistics / Vertical 03"
      title="PACKING / MACHINERY"
      image={packing}
      imageAlt="Packing machinery"
      intro="Specialist spares for industrial packing and bagging lines, including sealers, rollers, belts, and conveyor parts."
      collection={collection}
      fallbackProducts={products}
      expectedHandle={collectionHandle}
      productLines={productLines}
      activeLine={line}
    />
  );
}
