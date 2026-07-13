import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

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
      intro="Speak with the sales desk about part identification, product availability, quotations, orders, or account support. Choose the contact method that suits your request."
      sections={[
        {
          title: "Product identification",
          copy: "Send the manufacturer, part number, equipment model, and clear product photos where available so the team can identify the correct item.",
        },
        {
          title: "Quotes and orders",
          copy: "Include quantities, delivery location, required date, and any account or order reference so pricing and availability can be checked efficiently.",
        },
      ]}
      ctaLabel="View common questions"
      ctaTo="/got-a-question"
    >
      <section className="border-t border-rule bg-background py-10">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
          <ContactCard icon={Phone} title="Technical Sales" copy={SITE.phoneDisplay} detail={SITE.hours} href={`tel:${SITE.phoneHref}`} />
          <ContactCard icon={Mail} title="Email Enquiries" copy={SITE.email} detail="Send product questions or cart details" href={`mailto:${SITE.email}`} />
          <ContactCard icon={MessageCircle} title="WhatsApp" copy={SITE.phoneDisplay} detail="Useful for photos and part numbers" href={whatsappHref("Hello Spares Automation, I need help identifying a part.")} external />
          <ContactCard icon={MapPin} title="UK Support" copy={SITE.location} detail="Industrial parts and automation support" />
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
  icon: typeof Phone;
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
