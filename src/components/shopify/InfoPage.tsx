import { Link } from "@tanstack/react-router";
import { ArrowRight, Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { SITE } from "@/lib/site";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{
    title: string;
    copy: string;
  }>;
  ctaLabel?: string;
  ctaTo?: string;
  children?: ReactNode;
};

export function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
  ctaLabel = "Contact sales",
  ctaTo = "/contact-us",
  children,
}: InfoPageProps) {
  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <main id="main-content">
        <section className="border-b border-rule bg-charcoal-deep text-white">
          <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
              {eyebrow}
            </div>
            <h1 className="mt-4 max-w-4xl font-display text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/60 md:text-base">
              {intro}
            </p>
          </div>
        </section>

        <section className="bg-surface py-10 md:py-14">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 px-4 md:grid-cols-2 md:px-6">
            {sections.map((section) => (
              <article key={section.title} className="border border-rule bg-background p-6">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  {section.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-ink-muted">{section.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {children}

        <section className="border-t border-rule bg-background py-8">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="grid gap-2 text-sm text-ink-muted">
              <a href={`tel:${SITE.phoneHref}`} className="inline-flex min-h-8 items-center gap-2 hover:text-accent">
                <Phone className="h-4 w-4" />
                {SITE.phoneDisplay}
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center gap-2 hover:text-accent"
              >
                <Mail className="h-4 w-4" />
                {SITE.email}
              </a>
            </div>
            <Link
              to={ctaTo}
              className="inline-flex h-11 items-center justify-center gap-2 bg-accent px-5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent-foreground transition-colors hover:bg-accent/90"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
