import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/delivery-information")({
  head: () => pageHead("Delivery Information", "Delivery and lead-time guidance for stock and sourced industrial parts.", "/delivery-information"),
  component: DeliveryPage,
});

function DeliveryPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Delivery information"
      intro="Delivery options depend on item availability, supplier location, order time, and delivery address."
      sections={[
        {
          title: "Stock items",
          copy: "Available stock can usually be dispatched quickly once the order is confirmed and payment or account details are complete.",
        },
        {
          title: "Sourced items",
          copy: "For non-stock or additional quantities, the sales desk will confirm expected lead time before processing the order.",
        },
      ]}
    />
  );
}
