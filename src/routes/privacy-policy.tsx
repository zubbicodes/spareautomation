import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy-policy")({
  head: () => pageHead("Privacy Policy", "How Spares Automation uses customer, order, account, and product-enquiry information.", "/privacy-policy"),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Privacy policy"
      intro="Customer details are used to respond to enquiries, process orders, manage accounts, and provide product support."
      sections={[
        {
          title: "Information used",
          copy: "We may use contact, company, order, cart, and product enquiry details to provide sales and support service.",
        },
        {
          title: "Why information is used",
          copy: "Information is used to answer enquiries, take steps requested before a contract, process and support orders, maintain account security, meet legal obligations, and send marketing only where permitted.",
        },
        {
          title: "Service providers",
          copy: "Shopify and necessary hosting, delivery, payment, and communications providers may process information when they are needed to provide the requested service. Their own notices apply where they act independently.",
        },
        {
          title: "Retention and security",
          copy: "Records are retained only for as long as needed for the purpose collected, legal or accounting requirements, dispute handling, and service security. Access should be limited to people and providers who need it.",
        },
        {
          title: "Your choices and rights",
          copy: "You can ask about access, correction, deletion, restriction, objection, portability, or withdrawal of consent where the relevant right applies. Contact the sales email shown below; you may also complain to the UK Information Commissioner's Office.",
        },
        {
          title: "Support requests",
          copy: "Photos, part numbers, and equipment references sent to the sales desk are used to identify products and answer enquiries. Avoid including unrelated personal or confidential information.",
        },
      ]}
    />
  );
}
