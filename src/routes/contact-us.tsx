import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, type LucideIcon } from "lucide-react";

import { InfoPage } from "@/components/shopify/InfoPage";
import { SupportRequestForm } from "@/components/shopify/SupportRequestForm";
import { pageHead } from "@/lib/seo";
import { SITE, whatsappHref } from "@/lib/site";

export const Route = createFileRoute("/contact-us")({
  head: () =>
    pageHead(
      "Contact Industrial Parts Support",
      "Contact Spares Automation for product identification, quotations, availability, and industrial parts support.",
      "/contact-us",
    ),
  component: ContactUsPage,
});

function ContactUsPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Contact Spares Automation"
      compactHero
      sections={[]}
      ctaLabel="View common questions"
      ctaTo="/got-a-question"
    >
      <section className="border-t border-rule bg-background py-10">
        <div className="mx-auto grid max-w-[900px] grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:px-6">
          <ContactCard icon={Mail} title="Email Enquiries" copy={SITE.email} detail="Send product questions or cart details" href={`mailto:${SITE.email}`} />
          <ContactCard icon={MessageCircle} title="WhatsApp" copy={SITE.phoneDisplay} detail="Useful for photos and part numbers" href={whatsappHref("Hello Spares Automation, I need help identifying a part.")} external />
        </div>
      </section>
      <SupportRequestForm kind="question" />
    </InfoPage>
  );
}

function ContactCard({
  icon: Icon,
  title,
  copy,
  detail,
  href,
  external = false,
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
  detail: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <Icon aria-hidden="true" className="h-5 w-5 text-accent" />
      <h2 className="mt-4 font-display text-base font-bold uppercase tracking-tight">{title}</h2>
      <p className="mt-2 break-words text-sm font-semibold text-ink">{copy}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{detail}</p>
    </>
  );

  const className = "block min-w-0 border border-rule bg-surface p-5 transition-colors hover:border-accent";
  return href ? (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={className}>
      {content}
    </a>
  ) : (
    <article className="min-w-0 border border-rule bg-surface p-5">{content}</article>
  );
}
