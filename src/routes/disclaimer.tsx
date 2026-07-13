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
        {
          title: "Images and descriptions",
          copy: "Images may be illustrative and packaging, markings, colour, or minor construction details can change. Written manufacturer references and confirmed specifications should be used for final identification.",
        },
        {
          title: "Availability and pricing",
          copy: "Catalogue availability, lead times, and prices can change before an order is accepted. Current details are confirmed through checkout or a written quotation.",
        },
        {
          title: "Installation and safety",
          copy: "Industrial parts should be selected and installed by suitably competent personnel in accordance with the equipment documentation, applicable regulations, and site safety procedures.",
        },
        {
          title: "Third-party names",
          copy: "Manufacturer names, model references, and trademarks are used only to help identify compatibility and remain the property of their respective owners.",
        },
      ]}
    />
  );
}
