import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/shopify/SiteHeader";
import { SiteFooter } from "@/components/shopify/SiteFooter";
import {
  getShopifyCart,
  removeShopifyCartLine,
  updateShopifyCartLine,
} from "@/lib/api/shopify.functions";
import { clearStoredCartId, getStoredCartId, setStoredCartId } from "@/lib/shopify/cart";
import { formatMoney } from "@/lib/shopify/format";
import type { ShopifyCart } from "@/lib/shopify/types";
import { quoteRequestMailto } from "@/lib/quote";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart | Spares Automation" }, { name: "description", content: "Review selected industrial parts, continue to secure Shopify checkout, or request a quote by email." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CartPage,
});

function CartPage() {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyLineId, setBusyLineId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCart() {
      const cartId = getStoredCartId();
      if (!cartId) {
        setLoading(false);
        return;
      }
      try {
        const nextCart = await getShopifyCart({ data: { cartId } });
        setCart(nextCart);
        if (!nextCart) clearStoredCartId();
      } catch {
        setError("Your cart could not be loaded. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, []);

  async function updateLine(lineId: string, quantity: number) {
    const cartId = getStoredCartId();
    if (!cartId) return;
    setBusyLineId(lineId);
    setError("");
    try {
      const nextCart = await updateShopifyCartLine({ data: { cartId, lineId, quantity } });
      setCart(nextCart);
      setStoredCartId(nextCart.id);
    } catch {
      setError("We could not update this item. Your previous quantity is unchanged.");
    } finally {
      setBusyLineId(null);
    }
  }

  async function removeLine(lineId: string) {
    const cartId = getStoredCartId();
    if (!cartId) return;
    setBusyLineId(lineId);
    setError("");
    try {
      const nextCart = await removeShopifyCartLine({ data: { cartId, lineId } });
      setCart(nextCart);
      setStoredCartId(nextCart.id);
    } catch {
      setError("We could not remove this item. Please try again.");
    } finally {
      setBusyLineId(null);
    }
  }

  const isEmpty = !cart || cart.lines.length === 0;

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-[1600px] px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
              Secure Checkout
            </div>
            <h1 className="mt-2 font-display text-2xl md:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight">
              Cart
            </h1>
          </div>
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center border border-rule px-5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Continue browsing
          </Link>
        </div>

        {error ? <div role="alert" className="mb-5 border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
        {loading ? (
          <div className="border border-rule bg-surface px-4 py-12 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted md:px-8 md:py-16">
            Loading cart
          </div>
        ) : isEmpty ? (
          <div className="border border-dashed border-rule bg-surface px-4 py-12 text-center md:px-8 md:py-16">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center bg-accent text-accent-foreground">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-tight">
              Your cart is empty
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
              Add products from any category, then complete payment and shipping through checkout.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-[1fr_420px]">
            <section className="space-y-3 md:space-y-4">
              {cart.lines.map((line) => (
                <article
                  key={line.id}
                  className="grid grid-cols-[72px_1fr] gap-4 border border-rule bg-surface p-3 md:grid-cols-[96px_1fr] md:gap-5 md:p-4 lg:grid-cols-[120px_1fr_auto]"
                >
                  <Link
                    to="/products/$handle"
                    params={{ handle: line.merchandise.product.handle }}
                    className="aspect-square overflow-hidden bg-[oklch(0.96_0.005_250)]"
                  >
                    {line.merchandise.product.featuredImage ? (
                      <img
                        src={line.merchandise.product.featuredImage.url}
                        alt={
                          line.merchandise.product.featuredImage.altText ??
                          line.merchandise.product.title
                        }
                        className="h-full w-full object-cover mix-blend-multiply"
                      />
                    ) : null}
                  </Link>
                  <div>
                    <Link
                      to="/products/$handle"
                      params={{ handle: line.merchandise.product.handle }}
                      className="font-display text-base md:text-lg font-bold uppercase tracking-tight transition-colors hover:text-accent"
                    >
                      {line.merchandise.product.title}
                    </Link>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                      {line.merchandise.title}
                      {line.merchandise.sku ? ` / ${line.merchandise.sku}` : ""}
                    </div>
                    <div className="mt-4 md:mt-5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busyLineId === line.id || line.quantity <= 1}
                        onClick={() => updateLine(line.id, line.quantity - 1)}
                        aria-label={`Decrease quantity of ${line.merchandise.product.title}`}
                        className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center border border-rule text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3 md:h-4 md:w-4" />
                      </button>
                      <span className="flex h-8 min-w-10 md:h-9 md:min-w-12 items-center justify-center border border-rule px-2 md:px-3 font-mono text-sm">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={busyLineId === line.id || line.quantity >= 99}
                        onClick={() => updateLine(line.id, line.quantity + 1)}
                        aria-label={`Increase quantity of ${line.merchandise.product.title}`}
                        className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center border border-rule text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3 md:h-4 md:w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busyLineId === line.id}
                        onClick={() => removeLine(line.id)}
                        aria-label={`Remove ${line.merchandise.product.title} from cart`}
                        className="ml-2 flex h-8 w-8 md:h-9 md:w-9 items-center justify-center border border-rule text-ink-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 mt-3 flex justify-between md:col-span-1 md:mt-0 md:text-right">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                      Line total
                    </div>
                    <div className="font-display text-lg md:text-xl font-bold">
                      {formatMoney(line.cost.totalAmount)}
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit border border-rule bg-surface p-5 md:p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
                Order Summary
              </div>
              <div className="mt-6 space-y-4 border-b border-rule pb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Items</span>
                  <span>{cart.totalQuantity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Subtotal</span>
                  <span>{formatMoney(cart.cost.subtotalAmount)}</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="font-display text-lg font-bold uppercase tracking-tight">
                  Total
                </span>
                <span className="font-display text-xl md:text-2xl font-bold">
                  {formatMoney(cart.cost.totalAmount)}
                </span>
              </div>
              <a
                href={cart.checkoutUrl}
                className="mt-8 inline-flex h-12 w-full items-center justify-center bg-accent px-6 font-mono text-[11px] uppercase tracking-[0.22em] text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Continue to secure checkout
              </a>
              <a
                href={quoteRequestMailto(cart)}
                className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 border border-rule bg-background px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink transition-colors hover:border-accent hover:text-accent"
              >
                <FileText className="h-4 w-4" />
                Request quote by email
              </a>
              <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                Checkout completes an online order. Send cart details emails this cart to the
                sales desk for quote support, product checks, or account pricing.
              </p>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
