import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/returns-policy")({
  head: () => pageHead("Returns Policy", "How to request a return for industrial parts purchased through Spares Automation.", "/returns-policy"),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Returns policy"
      intro="Contact the sales desk before returning any item so the team can confirm the correct process for the product and supplier."
      sections={[
        {
          title: "Before returning",
          copy: "Provide the order number, item details, reason for return, and photos where useful. Do not send goods back until return details are confirmed.",
        },
        {
          title: "Special order parts",
          copy: "Some sourced or special-order industrial parts may have supplier-specific return restrictions, which will be confirmed case by case.",
        },
        {
          title: "Consumer cancellations",
          copy: "Where UK distance-selling cancellation rights apply, eligible consumers should notify us within the applicable period. Bespoke, made-to-order, or otherwise exempt goods may be treated differently.",
        },
        {
          title: "Faulty or incorrect goods",
          copy: "Report damage, faults, shortages, or incorrect goods promptly with the order number and supporting photos. Available remedies depend on the circumstances and applicable statutory rights.",
        },
        {
          title: "Refund timing",
          copy: "Approved refunds are returned using the appropriate original payment route after the return is received or other required evidence is provided, subject to the applicable transaction terms and legal rights.",
        },
      ]}
    />
  );
}
