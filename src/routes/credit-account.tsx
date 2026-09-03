import { createFileRoute } from "@tanstack/react-router";

import { CreditAccountApplicationForm } from "@/components/shopify/CreditAccountApplicationForm";
import { InfoPage } from "@/components/shopify/InfoPage";
import { useContent } from "@/lib/content/ContentContext";
import { getPublishedContent } from "@/lib/content/content.functions";
import { contentPageHead } from "@/lib/seo";

export const Route = createFileRoute("/credit-account")({
  loader: async () => {
    const { site, functional } = await getPublishedContent();
    return { site, seo: functional["credit-account"].seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(loaderData?.seo, loaderData?.site, "/credit-account", {
      title: "Apply for Credit Terms",
      description:
        "Apply for a Spares Automation credit account with company, reference, and credit limit details. Subject to credit check and written approval.",
    }),
  component: CreditAccountPage,
});

function CreditAccountPage() {
  const { functional } = useContent();
  const copy = functional["credit-account"];

  return (
    <InfoPage
      functionalKey="credit-account"
      eyebrow={copy.eyebrow}
      title={copy.title}
      intro={copy.intro}
      sections={[]}
      showHero={false}
      ctaLabel={copy.ctaLabel}
      ctaTo={copy.ctaTo}
    >
      <CreditAccountApplicationForm />
    </InfoPage>
  );
}
