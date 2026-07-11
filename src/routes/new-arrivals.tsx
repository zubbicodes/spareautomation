import { createFileRoute } from "@tanstack/react-router";

import { CollectionPage } from "@/components/shopify/CollectionPage";
import { getCollection, getLatestProducts } from "@/lib/api/shopify.functions";
import arrivals from "@/assets/cat-home.jpg";
import { SITE } from "@/lib/site";

const collectionHandle = "new-arrivals";

export const Route = createFileRoute("/new-arrivals")({
  head: () => ({
    meta: [
      { title: "New Arrivals | Spares Automation" },
      {
        name: "description",
        content: "Latest industrial spare updates and new product arrivals.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/new-arrivals` }],
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
  component: NewArrivalsPage,
});

function NewArrivalsPage() {
  const { collection, products } = Route.useLoaderData();

  return (
    <CollectionPage
      eyebrow="Catalogue / Latest"
      title="NEW ARRIVALS"
      image={arrivals}
      imageAlt="New arrivals"
      intro="The latest additions to the catalogue and recently listed industrial spares."
      collection={collection}
      fallbackProducts={products}
      expectedHandle={collectionHandle}
    />
  );
}
