import { createFileRoute } from "@tanstack/react-router";

import { CreditAccountApplicationForm } from "@/components/shopify/CreditAccountApplicationForm";
import { InfoPage } from "@/components/shopify/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/credit-account")({
  head: () =>
    pageHead(
      "Apply for Credit Terms",
      "Apply for a Spares Automation credit account with company, reference, and credit limit details. Subject to credit check and written approval.",
      "/credit-account",
    ),
  component: CreditAccountPage,
});

function CreditAccountPage() {
  return (
    <InfoPage
      eyebrow="Credit account"
      title="Apply for credit terms"
      intro="Credit accounts let established customers purchase on agreed payment terms. Submit your company and reference details below; the sales desk will run the necessary checks and confirm your credit limit and terms in writing."
      sections={[]}
      showHero={false}
      ctaLabel="Existing customer sign in"
      ctaTo="/login"
    >
      <CreditAccountApplicationForm />
    </InfoPage>
  );
}
