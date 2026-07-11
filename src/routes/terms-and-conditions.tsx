import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => pageHead("Terms and Conditions", "Trading guidance for orders, quotations, product information, and support from Spares Automation.", "/terms-and-conditions"),
  component: TermsPage,
});

function TermsPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Terms and conditions"
      intro="This page summarises how quotations, orders, product information, and support are handled. Terms confirmed at checkout or in a written quotation take precedence."
      sections={[
        {
          title: "Orders and quotes",
          copy: "Prices, availability, delivery dates, and product suitability are confirmed when the sales desk reviews the order or quote request.",
        },
        {
          title: "Product information",
          copy: "Product data is supplied to help identify parts. Customers should confirm compatibility before ordering critical spares.",
        },
        {
          title: "Contract and payment",
          copy: "An order or quote request is not accepted until availability, total price, delivery, payment terms, and any special-order conditions are confirmed through checkout or in writing.",
        },
        {
          title: "Customer details",
          copy: "Customers are responsible for providing accurate account, billing, delivery, tax, and contact information and for checking the order before payment or written acceptance.",
        },
        {
          title: "Consumer and trade purchases",
          copy: "Some statutory rights depend on whether a purchase is made as a consumer or in the course of business. Nothing on this page is intended to exclude rights that cannot lawfully be excluded.",
        },
        {
          title: "Written terms take precedence",
          copy: "Product-specific quotation terms, supplier restrictions, and the terms presented during Shopify checkout form part of the transaction and take precedence where they are more specific.",
        },
      ]}
    />
  );
}
