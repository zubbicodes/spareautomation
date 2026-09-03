import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { getPublishedContent } from "@/lib/content/content.functions";
import { contentPageHead } from "@/lib/seo";

export const Route = createFileRoute("/returns-policy")({
  loader: async () => {
    const { site, pages } = await getPublishedContent();
    return { site, seo: pages["returns-policy"].seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(loaderData?.seo, loaderData?.site, "/returns-policy", {
      title: "Returns Policy",
      description:
        "Information about return eligibility, approvals, shipping, inspections, refunds, and exchanges.",
    }),
  component: ReturnsPolicyPage,
});

/** All copy for this page lives in the "returns-policy" CMS document. */
function ReturnsPolicyPage() {
  return <InfoPage contentKey="returns-policy" />;
}
