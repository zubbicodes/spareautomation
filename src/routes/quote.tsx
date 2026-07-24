import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileText, Minus, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { getShopifyCustomer, submitShopifyQuote } from "@/lib/api/shopify.functions";
import { pageHead } from "@/lib/seo";
import { formatMoney } from "@/lib/shopify/format";
import {
  clearStoredQuote,
  getStoredQuote,
  setStoredQuote,
  type StoredQuoteItem,
} from "@/lib/shopify/quote";

export const Route = createFileRoute("/quote")({
  head: () =>
    pageHead(
      "Build a Quote",
      "Review industrial products and submit a quotation request to Spares Automation.",
      "/quote",
      true,
    ),
  component: QuotePage,
});

function QuotePage() {
  const [items, setItems] = useState<StoredQuoteItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [isCreditAccount, setIsCreditAccount] = useState(false);

  useEffect(() => {
    setItems(getStoredQuote());
    setLoaded(true);
  }, []);

  useEffect(() => {
    void getShopifyCustomer()
      .then((customer) => {
        const tags = customer?.tags ?? [];
        setIsCreditAccount(
          tags.some((tag) =>
            ["credit account", "credit-account"].includes(tag.toLowerCase()),
          ),
        );
      })
      .catch(() => {});
  }, []);

  const currencyCode = items[0]?.price.currencyCode ?? "GBP";
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + Number(item.price.amount) * item.quantity, 0),
    [items],
  );
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

  function saveItems(nextItems: StoredQuoteItem[]) {
    setItems(nextItems);
    setStoredQuote(nextItems);
  }

  function updateQuantity(variantId: string, quantity: number) {
    saveItems(
      items.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) }
          : item,
      ),
    );
  }

  function removeItem(variantId: string) {
    saveItems(items.filter((item) => item.variantId !== variantId));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || submitting) return;

    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");

    try {
      const result = await submitShopifyQuote({
        data: {
          email: String(data.get("email") ?? ""),
          firstName: String(data.get("firstName") ?? ""),
          lastName: String(data.get("lastName") ?? ""),
          company: String(data.get("company") ?? ""),
          phone: String(data.get("phone") ?? ""),
          additionalInformation: String(data.get("additionalInformation") ?? ""),
          website: String(data.get("website") ?? ""),
          lines: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        },
      });
      clearStoredQuote();
      setItems([]);
      setReference(result.reference);
    } catch (submissionError) {
      console.error(submissionError);
      setError(
        submissionError instanceof Error &&
          submissionError.message.includes("not configured")
          ? "Online quote submission is being configured. Please contact the sales desk in the meantime."
          : "We could not submit your quote. Please check your details and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-[1500px] px-4 py-8 md:px-6 md:py-12">
        <header className="mb-7 flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
              Product quotation
            </div>
            <h1 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
              My Quote
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
              Review your products, add your contact details, and submit the quote for sales review.
            </p>
          </div>
          <Link
            to="/products"
            search={{ category: "all", availability: "all", sort: "newest" }}
            className="inline-flex h-11 items-center justify-center border border-rule px-5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors hover:border-accent hover:text-accent"
          >
            Continue shopping
          </Link>
        </header>

        {reference ? (
          <section className="border border-rule bg-surface px-5 py-12 text-center md:px-8 md:py-16">
            <CheckCircle2 className="mx-auto h-12 w-12 text-accent" aria-hidden="true" />
            <h2 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight">
              Quote submitted
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Your reference is <strong className="text-ink">{reference}</strong>. Our sales team
              will review pricing, availability, and delivery before contacting you.
            </p>
            <Link
              to="/products"
              search={{ category: "all", availability: "all", sort: "newest" }}
              className="mt-6 inline-flex h-12 items-center justify-center bg-accent px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-accent-foreground"
            >
              Browse more products
            </Link>
          </section>
        ) : !loaded ? (
          <div className="border border-rule bg-surface py-16 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
            Loading quote
          </div>
        ) : items.length === 0 ? (
          <section className="border border-dashed border-rule bg-surface px-5 py-12 text-center md:py-16">
            <FileText className="mx-auto h-10 w-10 text-accent" aria-hidden="true" />
            <h2 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight">
              Your quote is empty
            </h2>
            <p className="mt-3 text-sm text-ink-muted">
              Choose “Build a quote” on any product page to add an item.
            </p>
          </section>
        ) : (
          <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section aria-labelledby="quote-items-title" className="space-y-4">
              <h2 id="quote-items-title" className="sr-only">Quote products</h2>
              {items.map((item) => (
                <article
                  key={item.variantId}
                  className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 border border-rule bg-surface p-3 sm:grid-cols-[100px_minmax(0,1fr)_auto] sm:p-4"
                >
                  <Link
                    to="/products/$handle"
                    params={{ handle: item.productHandle }}
                    className="aspect-square overflow-hidden bg-[oklch(0.96_0.005_250)]"
                  >
                    {item.image ? (
                      <img
                        src={item.image.url}
                        alt={item.image.altText ?? item.productTitle}
                        className="h-full w-full object-cover mix-blend-multiply"
                      />
                    ) : null}
                  </Link>
                  <div className="min-w-0">
                    <Link
                      to="/products/$handle"
                      params={{ handle: item.productHandle }}
                      className="font-display text-base font-bold uppercase leading-tight tracking-tight hover:text-accent md:text-lg"
                    >
                      {item.productTitle}
                    </Link>
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
                      {item.variantTitle}{item.sku ? ` / ${item.sku}` : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.productTitle}`}
                        className="flex h-9 w-9 items-center justify-center border border-rule hover:border-accent hover:text-accent disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="flex h-9 min-w-12 items-center justify-center border border-rule px-3 font-mono text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= 99}
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.productTitle}`}
                        className="flex h-9 w-9 items-center justify-center border border-rule hover:border-accent hover:text-accent disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        aria-label={`Remove ${item.productTitle} from quote`}
                        className="ml-1 flex h-9 w-9 items-center justify-center border border-rule text-ink-muted hover:border-accent hover:text-accent"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between border-t border-rule pt-3 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted sm:block">
                      Line total
                    </span>
                    <strong className="font-display text-lg sm:mt-2 sm:block">
                      {formatMoney({
                        amount: (Number(item.price.amount) * item.quantity).toFixed(2),
                        currencyCode: item.price.currencyCode,
                      })}
                    </strong>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit border border-rule bg-surface p-5 md:p-6 lg:sticky lg:top-4">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                Quote summary
              </h2>
              <dl className="mt-5 space-y-3 border-b border-rule pb-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Items</dt>
                  <dd>{totalQuantity}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Quote subtotal</dt>
                  <dd className="font-semibold">
                    {formatMoney({ amount: subtotal.toFixed(2), currencyCode })}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-ink-muted">
                {isCreditAccount
                  ? "As a credit account holder, submit this quote and the sales desk will raise a Shopify draft order with your agreed payment terms and email the invoice. No online payment is required."
                  : "Prices shown are indicative. Your final quotation will confirm price, VAT, availability, delivery, and payment terms."}
              </p>

              <fieldset className="mt-6 space-y-4">
                <legend className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink-muted">
                  Your details
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <QuoteField label="First name" name="firstName" autoComplete="given-name" required />
                  <QuoteField label="Last name" name="lastName" autoComplete="family-name" required />
                </div>
                <QuoteField label="Email address" name="email" type="email" autoComplete="email" required />
                <QuoteField label="Company" name="company" autoComplete="organization" />
                <QuoteField label="Phone" name="phone" type="tel" autoComplete="tel" />
                <label className="grid gap-2 text-xs font-semibold text-ink">
                  Additional information
                  <textarea
                    name="additionalInformation"
                    rows={5}
                    maxLength={3000}
                    className="min-w-0 resize-y border border-rule bg-background px-3 py-3 text-sm font-normal focus:border-accent focus:outline-none"
                  />
                </label>
                <label className="absolute -left-[9999px]" aria-hidden="true">
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </fieldset>

              {error ? (
                <div role="alert" className="mt-5 border border-red-300 bg-red-50 p-3 text-sm leading-5 text-red-800">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 bg-accent px-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-wait disabled:opacity-60"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                {submitting ? "Submitting quote" : "Submit quote"}
              </button>
            </aside>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function QuoteField({
  label,
  name,
  type = "text",
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-xs font-semibold text-ink">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="h-11 min-w-0 border border-rule bg-background px-3 text-sm font-normal focus:border-accent focus:outline-none"
      />
    </label>
  );
}
