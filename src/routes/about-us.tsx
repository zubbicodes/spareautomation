import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about-us")({
  head: () =>
    pageHead(
      "About Us",
      "Learn how Spares Automation helps machinery teams identify, source, and order industrial parts and automation spares.",
      "/about-us",
    ),
  component: AboutUsPage,
});

function AboutUsPage() {
  return (
    <InfoPage
      eyebrow="About us"
      title="Industrial parts and automation support"
      intro="Spares Automation supports plant operators, maintenance teams, and machinery businesses with product identification, sourcing, ordering, and technical sales assistance."
      sections={[
        {
          title: "What we do",
          copy: "We help customers identify and source industrial spares for asphalt, concrete, packing, control, and automation systems.",
        },
        {
          title: "How we help",
          copy: "Send a product reference, MPN, equipment photo, or cart details and the sales desk will check compatibility, pricing, availability, and delivery options.",
        },
        {
          title: "Who we support",
          copy: "Our service is designed for plant operators, maintenance departments, contractors, panel builders, and trade customers purchasing replacement components.",
        },
        {
          title: "Our approach",
          copy: "We prioritise clear product information and written confirmation for sourced items, helping customers verify the right component before ordering.",
        },
      ]}
      ctaLabel="Contact the sales desk"
      ctaTo="/contact-us"
    />
  );
}
