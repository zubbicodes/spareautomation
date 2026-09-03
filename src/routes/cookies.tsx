import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { getPublishedContent } from "@/lib/content/content.functions";
import { contentPageHead } from "@/lib/seo";

export const Route = createFileRoute("/cookies")({
  loader: async () => {
    const { site, pages } = await getPublishedContent();
    return { site, seo: pages.cookies.seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(loaderData?.seo, loaderData?.site, "/cookies", {
      title: "Cookie Policy",
      description:
        "How essential cookies and browser storage support cart, account, and checkout functionality.",
    }),
  component: CookiesPage,
});

/** All copy for this page lives in the "cookies" CMS document. */
function CookiesPage() {
  return <InfoPage contentKey="cookies" />;
}
