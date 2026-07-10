import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/disclaimer")({
  head: () => pageHead("Product Information Disclaimer", "Important guidance about industrial-part compatibility, specifications, images, and availability.", "/disclaimer"),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Disclaimer"
      intro="Product information is provided to support identification and purchasing decisions for industrial spares."
      sections={[
        {
          title: "Compatibility",
          copy: "Customers should confirm product compatibility with their machine, plant, or control system before ordering.",
        },
        {
          title: "Technical details",
          copy: "Specifications, images, and availability may vary by supplier or manufacturer reference and are confirmed at quote or order stage.",
        },
      ]}
    />
  );
}
