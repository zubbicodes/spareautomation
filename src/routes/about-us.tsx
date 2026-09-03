import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { getPublishedContent } from "@/lib/content/content.functions";
import { contentPageHead } from "@/lib/seo";

export const Route = createFileRoute("/about-us")({
  loader: async () => {
    const { site, pages } = await getPublishedContent();
    return { site, seo: pages["about-us"].seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(loaderData?.seo, loaderData?.site, "/about-us", {
      title: "About Us",
      description:
        "Learn how Spares Automation helps machinery teams identify, source, and order industrial parts and automation spares.",
    }),
  component: AboutUsPage,
});

/** All copy for this page lives in the "about-us" CMS document. */
function AboutUsPage() {
  return <InfoPage contentKey="about-us" />;
}
