import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { SupportRequestForm } from "@/components/shopify/SupportRequestForm";
import { useContent } from "@/lib/content/ContentContext";
import { getPublishedContent } from "@/lib/content/content.functions";
import { contentPageHead } from "@/lib/seo";

export const Route = createFileRoute("/got-a-question")({
  loader: async () => {
    const { site, functional } = await getPublishedContent();
    return { site, seo: functional["got-a-question"].seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(loaderData?.seo, loaderData?.site, "/got-a-question", {
      title: "Product and Quote Help",
      description:
        "Get help with product identification, availability, quotations, carts, and technical questions.",
    }),
  component: GotAQuestionPage,
});

function GotAQuestionPage() {
  const { functional } = useContent();
  const copy = functional["got-a-question"];

  return (
    <InfoPage
      functionalKey="got-a-question"
      eyebrow={copy.eyebrow}
      title={copy.title}
      intro={copy.intro}
      sections={[]}
      ctaLabel={copy.ctaLabel}
      ctaTo={copy.ctaTo}
    >
      <SupportRequestForm kind="question" />
    </InfoPage>
  );
}
