import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { SupportRequestForm } from "@/components/shopify/SupportRequestForm";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/got-a-question")({
  head: () => pageHead("Product and Quote Help", "Get help with product identification, availability, quotations, carts, and technical questions.", "/got-a-question"),
  component: GotAQuestionPage,
});

function GotAQuestionPage() {
  return (
    <InfoPage
      eyebrow="Questions"
      title="Got a question?"
      intro="For product identification, availability, technical details, quote help, or cart questions, contact the sales desk with as much reference detail as possible."
      sections={[
        {
          title: "Product questions",
          copy: "Send the part number, manufacturer reference, product photo, or equipment name and we will help identify the right item.",
        },
        {
          title: "Cart and quote questions",
          copy: "Add products to the cart and use request quote to email the current cart details to the sales desk.",
        },
      ]}
    ><SupportRequestForm kind="question" /></InfoPage>
  );
}
