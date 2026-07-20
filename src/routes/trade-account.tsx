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
      sections={[]}
      showHero={false}
      ctaLabel="Existing customer sign in"
      ctaTo="/login"
    >
      <TradeAccountApplicationForm />
    </InfoPage>
  );
}
