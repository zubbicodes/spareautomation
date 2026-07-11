import { createFileRoute, notFound } from "@tanstack/react-router";

import { ProductDetail } from "@/components/shopify/ProductDetail";
import { getProduct } from "@/lib/api/shopify.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/products/$handle")({
  loader: async ({ params }) => {
    const product = await getProduct({ data: { handle: params.handle } });
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.title ?? "Product"} | Spares Automation` },
      { name: "description", content: loaderData?.product.description?.slice(0, 155) || "Industrial product details, pricing, availability, and quote support." },
      { property: "og:title", content: loaderData?.product.title ?? "Product | Spares Automation" },
      { property: "og:type", content: "product" },
      ...(loaderData?.product.featuredImage ? [{ property: "og:image", content: loaderData.product.featuredImage.url }] : []),
    ],
    links: loaderData?.product ? [{ rel: "canonical", href: `${SITE.url}/products/${loaderData.product.handle}` }] : [],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();

  return <ProductDetail product={product} />;
}
