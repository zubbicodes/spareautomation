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
        {
          title: "Delivery charges",
          copy: "Delivery cost depends on item size, weight, supplier location, and destination. The applicable charge is shown at checkout or confirmed in a written quotation before the order is accepted.",
        },
        {
          title: "Dispatch and tracking",
          copy: "Where courier tracking is available, details are provided through the Shopify order-status page or by the sales desk after dispatch.",
        },
        {
          title: "Damage or shortages",
          copy: "Check deliveries promptly and report visible damage, missing items, or incorrect goods with the order number, packaging details, and supporting photos.",
        },
        {
          title: "International delivery",
          copy: "International availability, transport, duties, taxes, import requirements, and delivery responsibility must be confirmed before an overseas order is processed.",
        },
      ]}
    />
  );
}
