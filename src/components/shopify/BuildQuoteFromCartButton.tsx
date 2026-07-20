import { useNavigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { addCartToStoredQuote } from "@/lib/shopify/quote";
import type { ShopifyCart } from "@/lib/shopify/types";

export function BuildQuoteFromCartButton({ cart }: { cart: ShopifyCart }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => {
        addCartToStoredQuote(cart);
        void navigate({ to: "/quote" });
      }}
      className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 border border-rule bg-background px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink transition-colors hover:border-accent hover:text-accent"
    >
      <FileText className="h-4 w-4" aria-hidden="true" />
      Build a quote
    </button>
  );
}
