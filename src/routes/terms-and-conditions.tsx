import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { getPublishedContent } from "@/lib/content/content.functions";
import { contentPageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms-and-conditions")({
  loader: async () => {
    const { site, pages } = await getPublishedContent();
    return { site, seo: pages["terms-and-conditions"].seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(loaderData?.seo, loaderData?.site, "/terms-and-conditions", {
      title: "Terms and Conditions",
      description:
        "Trading guidance for orders, quotations, product information, and support from Spares Automation.",
    }),
  component: TermsPage,
});

/** All copy for this page lives in the "terms-and-conditions" CMS document. */
function TermsPage() {
  return <InfoPage contentKey="terms-and-conditions" />;
}
