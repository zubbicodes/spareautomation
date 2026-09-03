import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { getPublishedContent } from "@/lib/content/content.functions";
import { contentPageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy-policy")({
  loader: async () => {
    const { site, pages } = await getPublishedContent();
    return { site, seo: pages["privacy-policy"].seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(loaderData?.seo, loaderData?.site, "/privacy-policy", {
      title: "Privacy Policy",
      description:
        "How Spares Automation uses customer, order, account, and product-enquiry information.",
    }),
  component: PrivacyPolicyPage,
});

/** All copy for this page lives in the "privacy-policy" CMS document. */
function PrivacyPolicyPage() {
  return <InfoPage contentKey="privacy-policy" />;
}
