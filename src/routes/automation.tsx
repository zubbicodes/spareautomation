import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shopify/CollectionPage";
import { getCollection, getLatestProducts } from "@/lib/api/shopify.functions";
import automation from "@/assets/cat-automation.jpg";
import { SITE } from "@/lib/site";

const collectionHandle = "automation";
const productLines = [
  { slug: "drives", label: "Drives", keywords: ["vfd", "drive", "motor"] },
  { slug: "plc", label: "PLC Modules", keywords: ["plc", "input", "module"] },
  { slug: "sensors", label: "Sensors", keywords: ["sensor", "proximity", "m18"] },
  { slug: "control-cabinet", label: "Control Cabinet", keywords: ["contactor", "relay", "cabinet"] },
];

export const Route = createFileRoute("/automation")({
  validateSearch: (search: Record<string, unknown>) => ({
    line: typeof search.line === "string" ? search.line : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Automation & Drives | Spares Automation" },
      {
        name: "description",
        content: "Product range for automation, drives, and controls.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/automation` }],
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
  component: AutomationPage,
});

function AutomationPage() {
  const { collection, products } = Route.useLoaderData();
  const { line } = Route.useSearch();

  return (
    <CollectionPage
      eyebrow="Catalogue / Systems / Vertical 03"
      title="AUTOMATION / DRIVES"
      image={automation}
      imageAlt="Automation and drives"
      intro="VFDs, PLC modules, servo drives, relays, and control spares for plant and panel support."
      collection={collection}
      fallbackProducts={products}
      expectedHandle={collectionHandle}
      productLines={productLines}
      activeLine={line}
    />
  );
}
