import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { TradeAccountApplicationForm } from "@/components/shopify/TradeAccountApplicationForm";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/trade-account")({
  head: () =>
    pageHead(
      "Open a Trade Account",
      "Apply for a Spares Automation trade account using your company, purchasing, billing, and delivery details.",
      "/trade-account",
    ),
  component: TradeAccountPage,
});

function TradeAccountPage() {
  return (
    <InfoPage
      eyebrow="Trade account"
      title="Apply for a trade account"
      intro="Trade accounts are intended for businesses purchasing industrial parts regularly. Submit your company and purchasing details for review; pricing and payment terms are confirmed in writing by the sales desk."
      sections={[
        {
          title: "What you will need",
          copy: "Provide the registered company name, main contact, billing and delivery details, company or VAT numbers where applicable, and expected purchasing requirements.",
        },
        {
          title: "Review and approval",
          copy: "Submitting an application does not automatically create credit terms. The sales desk may request references or further checks before confirming pricing, limits, and payment terms.",
        },
      ]}
      ctaLabel="Existing customer sign in"
      ctaTo="/login"
    >
      <TradeAccountApplicationForm />
    </InfoPage>
  );
}
