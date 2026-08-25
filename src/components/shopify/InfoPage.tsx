import { Link } from "@tanstack/react-router";
import { ArrowRight, Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { SITE } from "@/lib/site";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  intro?: string;
  sections: Array<{
    title: string;
    copy: string;
  }>;
  ctaLabel?: string;
  ctaTo?: string;
  showHero?: boolean;
  compactHero?: boolean;
  showCta?: boolean;
  children?: ReactNode;
};

export function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
  ctaLabel = "Contact sales",
  ctaTo = "/contact-us",
  showHero = true,
  compactHero = true,
  showCta = true,
  children,
}: InfoPageProps) {
  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <main id="main-content">
        {showHero ? (
          <section
            className={`border-b border-rule bg-charcoal-deep text-white ${
              compactHero ? "flex min-h-[150px] items-center md:min-h-[180px]" : ""
            }`}
          >
            <div
              className={`mx-auto max-w-[1200px] px-4 md:px-6 ${
                compactHero ? "py-8 md:py-10" : "py-12 md:py-16"
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
                {eyebrow}
              </div>
              <h1
                className={`max-w-4xl font-display font-extrabold uppercase leading-tight tracking-tight ${
                  compactHero ? "mt-3 text-3xl md:text-4xl" : "mt-4 text-3xl md:text-5xl"
                }`}
              >
                {title}
              </h1>
              {intro ? (
                <p
                  className={`max-w-3xl text-sm leading-7 text-white/60 md:text-base ${
                    compactHero ? "mt-3" : "mt-5"
                  }`}
                >
                  {intro}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {sections.length > 0 ? (
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
        ) : null}

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
            {showCta ? (
              <Link
                to={ctaTo}
                className="inline-flex h-11 items-center justify-center gap-2 bg-accent px-5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent-foreground transition-colors hover:bg-accent/90"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
