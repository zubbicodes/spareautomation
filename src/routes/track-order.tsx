import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Loader2, PackageSearch } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { SignInRequired } from "@/components/shopify/SignInRequired";
import { SupportRequestForm } from "@/components/shopify/SupportRequestForm";
import { getShopifyCustomer } from "@/lib/api/shopify.functions";
import { formatMoney } from "@/lib/shopify/format";
import { useContent } from "@/lib/content/ContentContext";
import { getPublishedContent } from "@/lib/content/content.functions";
import { contentPageHead } from "@/lib/seo";

type Customer = Awaited<ReturnType<typeof getShopifyCustomer>>;

export const Route = createFileRoute("/track-order")({
  loader: async () => {
    const { site, functional } = await getPublishedContent();
    return { site, seo: functional["track-order"].seo };
  },
  head: ({ loaderData }) =>
    contentPageHead(loaderData?.seo, loaderData?.site, "/track-order", {
      title: "Track an Order",
      description: "Sign in to view and track your Spares Automation orders.",
    }, { noIndex: true }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const { functional, messages } = useContent();
  const copy = functional["track-order"];
  const [customer, setCustomer] = useState<Customer>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await getShopifyCustomer();
        if (active) setCustomer(result);
      } catch {
        if (active) setError(messages["track.loadFailed"]);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [messages]);

  const orders = customer?.orders ?? [];
  const orderHistoryAvailable = customer?.orderHistoryAvailable ?? false;

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main id="main-content">
        <section className="border-b border-rule bg-charcoal-deep text-white">
          <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
              {copy.eyebrow}
            </div>
            <h1 className="mt-3 max-w-4xl font-display text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl">
              {copy.title}
            </h1>
            {copy.intro ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60 md:text-base">
                {copy.intro}
              </p>
            ) : null}
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-14">
          {error ? (
            <div role="alert" className="mb-6 border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>
          ) : null}

          {loading ? (
            <div className="flex items-center gap-2 border border-rule bg-surface px-4 py-12 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted md:px-8 md:py-16">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> {copy.loadingLabel}
            </div>
          ) : !customer ? (
            <SignInRequired
              redirect="/track-order"
              title="Sign in to track your orders"
              description="Order tracking is linked to your account. Sign in to view live status and courier details for every order placed with Spares Automation."
            />
          ) : !orderHistoryAvailable ? (
            <section className="border border-rule bg-surface p-5 md:p-8">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight md:text-2xl">{copy.noticeTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">{copy.helpCopy}</p>
            </section>
          ) : orders.length === 0 ? (
            <section className="border border-rule bg-surface p-5 md:p-8">
              <PackageSearch aria-hidden="true" className="mb-4 h-8 w-8 text-accent" />
              <h2 className="font-display text-xl font-bold uppercase tracking-tight md:text-2xl">{copy.emptyTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">{copy.emptyCopy}</p>
              <Link
                to="/products"
                search={{ category: "all", availability: "all", sort: "newest" }}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 bg-accent px-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white hover:brightness-110"
              >
                Browse products <PackageSearch aria-hidden="true" className="h-4 w-4" />
              </Link>
            </section>
          ) : (
            <section aria-labelledby="track-orders-title" className="border border-rule bg-surface p-5 md:p-8">
              <div className="flex flex-col gap-2 border-b border-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-muted">{copy.sectionEyebrow}</div>
                  <h2 id="track-orders-title" className="mt-2 font-display text-xl font-bold uppercase tracking-tight md:text-2xl">{copy.sectionTitle}</h2>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                  {orders.length} recent {orders.length === 1 ? "order" : "orders"}
                </span>
              </div>
              <div className="divide-y divide-rule">
                {orders.map((order) => (
                  <article key={order.id} className="grid gap-4 py-5 lg:grid-cols-[180px_1fr_auto] lg:items-center">
                    <div>
                      <h3 className="font-display text-lg font-bold uppercase tracking-tight">{order.name || `Order #${order.orderNumber}`}</h3>
                      <p className="mt-1 text-sm text-ink-muted">{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(order.processedAt))}</p>
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {order.financialStatus ? <OrderStatus>{formatStatus(order.financialStatus)}</OrderStatus> : null}
                        <OrderStatus>{formatStatus(order.fulfillmentStatus)}</OrderStatus>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
                        {order.lineItems.map((item) => `${item.quantity}× ${item.title}${item.variant?.title && item.variant.title !== "Default Title" ? ` (${item.variant.title})` : ""}`).join(", ")}
                      </p>
                    </div>
                    <div className="grid gap-2 lg:justify-items-end">
                      <strong className="font-display text-lg text-ink">{formatMoney(order.totalPrice)}</strong>
                      <a href={order.statusUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 bg-accent px-4 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white hover:brightness-110">
                        Track order <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Anyone can ask the desk for an update, signed in or not. */}
        <SupportRequestForm kind="tracking" />

        <section className="border-t border-rule bg-surface py-8">
          <div className="mx-auto flex max-w-[1200px] items-center justify-end px-4 md:px-6">
            {copy.ctaLabel ? (
              <Link
                to={copy.ctaTo}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 border border-rule px-5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] hover:border-accent hover:text-accent"
              >
                {copy.ctaLabel}
              </Link>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function OrderStatus({ children }: { children: string }) {
  return <span className="border border-rule bg-background px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-muted">{children}</span>;
}

function formatStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}
