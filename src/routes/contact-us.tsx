import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone, type LucideIcon } from "lucide-react";

import { InfoPage } from "@/components/shopify/InfoPage";
import { SupportRequestForm } from "@/components/shopify/SupportRequestForm";
import { contentPageHead } from "@/lib/seo";
import { useContent } from "@/lib/content/ContentContext";
import { getPublishedContent } from "@/lib/content/content.functions";

export const Route = createFileRoute("/contact-us")({
  loader: async () => {
    const { site, pages } = await getPublishedContent();
    return { site, seo: pages["contact-us"].seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(loaderData?.seo, loaderData?.site, "/contact-us", {
      title: "Contact Industrial Parts Support",
      description:
        "Contact Spares Automation for product identification, quotations, availability, and industrial parts support.",
    }),
  component: ContactUsPage,
});

function ContactUsPage() {
  const { site, messages } = useContent();
  return (
    <InfoPage contentKey="contact-us">
      <section className="border-t border-rule bg-background py-10">
        <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 md:px-6">
          <ContactCard
            icon={Mail}
            title={messages["contact.emailLabel"]}
            copy={site.email}
            detail={messages["contact.emailDetail"]}
            href={`mailto:${site.email}`}
          />
          <ContactCard
            icon={Phone}
            title={messages["contact.phoneLabel"]}
            copy={site.phoneDisplay}
            detail={messages["contact.phoneDetail"]}
            href={`tel:${site.phoneHref}`}
          />
          <ContactCard
            icon={MessageCircle}
            title={messages["contact.whatsappLabel"]}
            copy={site.phoneDisplay}
            detail={messages["contact.whatsappDetail"]}
            href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hello ${site.name}, ${messages["contact.whatsappMessage"]}`)}`}
            external
          />
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
