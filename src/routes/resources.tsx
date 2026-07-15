import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { SupportRequestForm } from "@/components/shopify/SupportRequestForm";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/resources")({
  head: () => pageHead("PDFs, Manuals and Videos", "Request product manuals, technical PDFs, datasheets, and setup videos for industrial parts and equipment.", "/resources"),
  component: ResourcesPage,
});

function ResourcesPage() {
  return (
    <InfoPage
      eyebrow="PDFs & Videos"
      title="Request PDFs, manuals, and videos"
      intro="This is a request service rather than a public download library. Send the relevant part or machine details so the sales desk can supply the correct document or video version."
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
