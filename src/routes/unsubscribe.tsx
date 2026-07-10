import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { SupportRequestForm } from "@/components/shopify/SupportRequestForm";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/unsubscribe")({
  head: () => pageHead("Unsubscribe", "Request removal from Spares Automation marketing and product-update emails.", "/unsubscribe", true),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Unsubscribe"
      intro="To stop marketing or product update emails, contact the sales desk with the email address that should be removed."
      sections={[
        {
          title: "Email updates",
          copy: "Send a short unsubscribe request from the email address you want removed, or include the address in your message.",
        },
        {
          title: "Service messages",
          copy: "Order, quote, account, and support messages may still be sent where needed to complete an active request.",
        },
      ]}
    ><SupportRequestForm kind="unsubscribe" /></InfoPage>
  );
}
