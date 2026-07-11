import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/trade-account")({
  head: () => pageHead("Open a Trade Account", "Create a customer account and contact the sales desk to discuss trade pricing and account terms.", "/trade-account"),
  component: TradeAccountPage,
});

function TradeAccountPage() {
  return (
    <InfoPage
      eyebrow="Trade account"
      title="Open a trade account"
      intro="Create an account to keep your details ready for future orders and quote requests. Trade pricing and account terms are confirmed by the sales desk."
      sections={[
        {
          title: "Online registration",
          copy: "Use the registration form to create your customer login with name, email, phone number, and password.",
        },
        {
          title: "Trade approval",
          copy: "For account terms or repeat purchasing requirements, contact sales with your company details and expected product ranges.",
        },
      ]}
      ctaLabel="Create account"
      ctaTo="/register"
    />
  );
}
