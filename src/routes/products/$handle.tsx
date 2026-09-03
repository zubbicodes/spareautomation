import { createFileRoute, notFound } from "@tanstack/react-router";

import { ProductDetail } from "@/components/shopify/ProductDetail";
import { getProduct } from "@/lib/api/shopify.functions";
import { getPublishedContent } from "@/lib/content/content.functions";

export const Route = createFileRoute("/products/$handle")({
  loader: async ({ params }) => {
    const [product, content] = await Promise.all([
      getProduct({ data: { handle: params.handle } }),
      getPublishedContent(),
    ]);
    if (!product) throw notFound();
    return { product, site: content.site };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.title ?? "Product"} | ${loaderData?.site.name ?? "Spares Automation"}` },
      { name: "description", content: loaderData?.product.description?.slice(0, 155) || "Industrial product details, pricing, availability, and quote support." },
      { property: "og:title", content: loaderData?.product.title ?? "Product" },
      { property: "og:type", content: "product" },
      ...(loaderData?.site ? [{ property: "og:site_name", content: loaderData.site.name }] : []),
      ...(loaderData?.product.featuredImage ? [{ property: "og:image", content: loaderData.product.featuredImage.url }] : []),
    ],
    links: loaderData?.product
      ? [
          {
            rel: "canonical",
            href: `${(loaderData.site?.url ?? "https://spares-automation.co.uk").replace(/\/$/, "")}/products/${loaderData.product.handle}`,
          },
        ]
      : [],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();

  return <ProductDetail product={product} />;
}
