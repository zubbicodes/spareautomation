import { useNavigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { addProductToStoredQuote } from "@/lib/shopify/quote";
import type { ShopifyProduct, ShopifyVariant } from "@/lib/shopify/types";

type AddToQuoteButtonProps = {
  product: ShopifyProduct;
  variant?: ShopifyVariant;
  quantity: number;
  className?: string;
};

export function AddToQuoteButton({
  product,
  variant,
  quantity,
  className,
}: AddToQuoteButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      disabled={!variant}
      onClick={() => {
        if (!variant) return;
        addProductToStoredQuote(product, variant, quantity);
        void navigate({ to: "/quote" });
      }}
      className={
        className ??
        "inline-flex h-12 items-center justify-center gap-2 border border-accent bg-accent/5 px-5 font-mono text-[11px] uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      <FileText className="h-4 w-4" aria-hidden="true" />
      Build a quote
    </button>
  );
}
