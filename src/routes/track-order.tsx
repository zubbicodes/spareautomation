import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { SupportRequestForm } from "@/components/shopify/SupportRequestForm";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/track-order")({
  head: () => pageHead("Track an Order", "Request an order update using your order number and customer details.", "/track-order", true),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  return (
    <InfoPage
      eyebrow="Order support"
      title="Track an order"
      intro="Order tracking is handled by the support desk using your order number, email address, company name, or delivery postcode."
      sections={[
        {
          title: "What to send",
          copy: "Include your order number if available, plus the name or email used at checkout so we can locate the order quickly.",
        },
        {
          title: "Delivery updates",
          copy: "We will confirm current status, courier details where available, and any expected delivery or back-order dates.",
        },
      ]}
      ctaLabel="View account orders"
      ctaTo="/account"
    ><SupportRequestForm kind="tracking" /></InfoPage>
  );
}
