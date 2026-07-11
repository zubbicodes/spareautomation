import { createFileRoute } from "@tanstack/react-router";

import aboutImg from "@/assets/asphalt-plant.jpg";
import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about-us")({
  head: () => pageHead("About Us", "Learn how Spares Automation helps machinery teams identify, source, and order industrial parts and automation spares.", "/about-us"),
  component: AboutUsPage,
});

function AboutUsPage() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <section className="relative flex min-h-[340px] items-end overflow-hidden md:min-h-[460px]">
        <img
          src={aboutImg}
          alt="Industrial asphalt plant"
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/65 to-transparent" />
        <div className="relative mx-auto w-full max-w-[1600px] px-4 pb-12 md:px-6 lg:px-10">
          <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">
            <span className="h-px w-8 bg-accent" />
            About us
          </div>
          <h1 className="max-w-4xl font-display text-[2.2rem] font-extrabold uppercase leading-[0.95] tracking-tight text-white md:text-[4rem]">
            Industrial parts and automation support
          </h1>
        </div>
      </section>

      <main id="main-content" className="bg-surface py-12 md:py-16">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 md:grid-cols-2 md:px-6">
          <article className="border border-rule bg-background p-6 md:p-8">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight">What we do</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Spares Automation helps customers identify, order, and source industrial spares for
              plant, machinery, controls, and automation systems.
            </p>
          </article>
          <article className="border border-rule bg-background p-6 md:p-8">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight">How we help</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Send a product reference, MPN, equipment photo, or cart details and the sales desk
              will confirm availability, pricing, and delivery options.
            </p>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
