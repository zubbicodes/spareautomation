import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calculator,
  Clock3,
  Globe2,
  PackageCheck,
  Route as RouteIcon,
  ShieldCheck,
} from "lucide-react";

import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { contentPageHead } from "@/lib/seo";
import { getPublishedContent } from "@/lib/content/content.functions";
import { useContent } from "@/lib/content/ContentContext";

export const Route = createFileRoute("/delivery-information")({
  loader: async () => {
    const { site, pages } = await getPublishedContent();
    return { site, seo: pages["delivery-information"].seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(loaderData?.seo, loaderData?.site, "/delivery-information", {
      title: "Delivery Information",
      description:
        "How delivery charges, lead times, dispatch updates, tracking, and delivery issues are handled.",
    }),
  component: DeliveryPage,
});

/** Card icons stay code-owned; the CMS supplies each card's wording and order. */
const DETAIL_ICONS = [Calculator, Clock3, RouteIcon, ShieldCheck, PackageCheck, Globe2];

function DeliveryPage() {
  const page = useContent().pages["delivery-information"];
  const journey = page.blocks.find((block) => block.type === "steps");
  const details = page.blocks.find((block) => block.type === "cards");
  const notice = page.blocks.find((block) => block.type === "cta");
  const stages = journey?.type === "steps" ? journey.items : [];
  const detailCards = details?.type === "cards" ? details.items : [];

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main id="main-content">
        <section className="border-b border-rule bg-ink text-white">
          <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-10">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              {page.eyebrow}
            </p>
            <h1 className="mt-3 max-w-4xl font-display text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl">
              {page.title}
            </h1>
            {page.intro ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 md:text-base">
                {page.intro}
              </p>
            ) : null}
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-14">
          {stages.length ? (
            <section
              aria-labelledby="delivery-journey-title"
              className="grid gap-px border border-rule bg-rule md:grid-cols-3"
            >
              {stages.map(({ title, copy }, index) => {
                const number = String(index + 1).padStart(2, "0");
                return (
                  <article key={number} className="bg-surface p-5 md:p-6">
                    <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-accent">
                      {number}
                    </p>
                    <h2
                      id={number === "01" ? "delivery-journey-title" : undefined}
                      className="mt-4 font-display text-lg font-bold uppercase tracking-tight"
                    >
                      {title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">{copy}</p>
                  </article>
                );
              })}
            </section>
          ) : null}

          {detailCards.length ? (
            <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {detailCards.map((detail, index) => {
                const Icon = DETAIL_ICONS[index % DETAIL_ICONS.length];
                return (
                  <article key={detail.title} className="border border-rule bg-surface p-5 md:p-6">
                    <Icon aria-hidden="true" className="h-6 w-6 text-accent" />
                    <h2 className="mt-5 font-display text-lg font-bold uppercase tracking-tight">
                      {detail.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-ink-muted">{detail.copy}</p>
                  </article>
                );
              })}
            </section>
          ) : null}

          {notice?.type === "cta" ? (
            <section className="mt-10 border border-rule bg-surface p-5 md:flex md:items-center md:justify-between md:gap-8 md:p-7">
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                  {notice.title}
                </h2>
                {notice.copy ? (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{notice.copy}</p>
                ) : null}
              </div>
              <Link
                to={notice.to}
                hash="return-request"
                className="mt-5 inline-flex h-11 shrink-0 items-center gap-2 bg-accent px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white hover:brightness-110 md:mt-0"
              >
                {notice.label} <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </section>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
