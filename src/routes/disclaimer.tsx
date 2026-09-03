import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { getPublishedContent } from "@/lib/content/content.functions";
import { contentPageHead } from "@/lib/seo";

export const Route = createFileRoute("/disclaimer")({
  loader: async () => {
    const { site, pages } = await getPublishedContent();
    return { site, seo: pages.disclaimer.seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(loaderData?.seo, loaderData?.site, "/disclaimer", {
      title: "Product Information Disclaimer",
      description:
        "Important guidance about industrial-part compatibility, specifications, images, and availability.",
    }),
  component: DisclaimerPage,
});

/** All copy for this page lives in the "disclaimer" CMS document. */
function DisclaimerPage() {
  return <InfoPage contentKey="disclaimer" />;
}
