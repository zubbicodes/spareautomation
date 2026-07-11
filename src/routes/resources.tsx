import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { SupportRequestForm } from "@/components/shopify/SupportRequestForm";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/resources")({
  head: () => pageHead("Product Resources", "Request product manuals, technical PDFs, datasheets, and setup videos for industrial parts and equipment.", "/resources"),
  component: ResourcesPage,
});

function ResourcesPage() {
  return (
    <InfoPage
      eyebrow="Resources"
      title="PDFs, manuals, and videos"
      intro="Product documents and support videos are supplied against the relevant part, machine, or enquiry so the sales desk can send the correct version."
      sections={[
        {
          title: "PDFs and manuals",
          copy: "Send the part number, product name, or equipment photo and we will provide available datasheets, manuals, and technical documents.",
        },
        {
          title: "Video support",
          copy: "Where setup or identification videos are available, we can share the correct link with your quote or product response.",
        },
      ]}
      ctaLabel="Request resources"
    ><SupportRequestForm kind="resources" /></InfoPage>
  );
}
