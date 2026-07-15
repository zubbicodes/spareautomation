import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/shopify/ProductCard";
import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import type { ShopifyCollection, ShopifyProduct } from "@/lib/shopify/types";

export type ProductLineFilter = {
  slug: string;
  label: string;
  keywords: string[];
};

type CollectionPageProps = {
  eyebrow: string;
  title: string;
  accent?: "accent" | "amber";
  image: string;
  imageAlt: string;
  collection: ShopifyCollection | null;
  fallbackProducts?: ShopifyProduct[];
  expectedHandle: string;
  productLines?: ProductLineFilter[];
  activeLine?: string;
};

export function CollectionPage({
  eyebrow,
  title,
  accent = "accent",
  image,
  imageAlt,
  collection,
  fallbackProducts = [],
  expectedHandle,
  productLines = [],
  activeLine,
}: CollectionPageProps) {
  const products = collection?.products ?? fallbackProducts;
  const selectedLine = productLines.find((line) => line.slug === activeLine);
  const visibleProducts = selectedLine ? products.filter((product) => matchesLine(product, selectedLine)) : products;
  const accentClass = accent === "amber" ? "text-amber" : "text-accent";
  const bgAccentClass = accent === "amber" ? "bg-amber" : "bg-accent";

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <main id="main-content">
      <section className="relative flex h-[45vh] min-h-[300px] w-full min-w-0 items-end overflow-hidden md:h-[52vh] md:min-h-[360px] lg:h-[58vh] lg:min-h-[420px]">
        <img
          src={collection?.image?.url ?? image}
          alt={collection?.image?.altText ?? imageAlt}
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/65 to-transparent" />
        <div className="relative mx-auto w-full max-w-[1600px] px-4 md:px-6 lg:px-10 pb-12 md:pb-16 lg:pb-20">
          <div className="mb-4 md:mb-6 flex items-center gap-3 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-white/60">
            <span className={`h-px w-6 md:w-8 ${bgAccentClass}`} />
            {eyebrow}
          </div>
          <h1 className="break-words font-display text-[clamp(1.65rem,8vw,5rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-white lg:leading-[0.9]">
            {title}{" "}
            <span className={accentClass}>{collection?.title ? "CATALOGUE" : "SPARES"}</span>
          </h1>
        </div>
      </section>

      <section className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 md:gap-4 px-4 md:px-6 py-5 md:py-7 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
              Product Range
            </div>
            <h2 className="mt-1 md:mt-2 font-display text-xl md:text-2xl font-bold uppercase tracking-tight">
              {collection?.title ?? expectedHandle}
            </h2>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to overview
          </Link>
        </div>
      </section>

      {productLines.length ? (
        <section className="border-b border-rule bg-background">
          <div className="mx-auto max-w-[1600px] px-4 py-4 md:px-6">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
              Product lines
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <a
                href={`/${expectedHandle}`}
                className={`shrink-0 border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                  !selectedLine
                    ? `${bgAccentClass} border-transparent text-accent-foreground`
                    : "border-rule bg-surface text-ink-muted hover:border-accent hover:text-accent"
                }`}
              >
                All
              </a>
              {productLines.map((line) => (
                <a
                  key={line.slug}
                  href={`/${expectedHandle}?line=${line.slug}`}
                  className={`shrink-0 border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                    selectedLine?.slug === line.slug
                      ? `${bgAccentClass} border-transparent text-accent-foreground`
                      : "border-rule bg-surface text-ink-muted hover:border-accent hover:text-accent"
                  }`}
                >
                  {line.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-background py-8 md:py-10 lg:py-12">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6">
          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-rule bg-surface px-4 py-10 md:px-8 md:py-16 text-center">
              <div
                className={`mx-auto mb-4 md:mb-6 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center ${bgAccentClass} text-accent-foreground`}
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <h3 className="font-display text-xl md:text-2xl font-bold uppercase tracking-tight">
                {selectedLine ? `No products found in ${selectedLine.label}` : "Catalogue products are being updated"}
              </h3>
              <p className="mx-auto mt-3 md:mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
                {selectedLine ? "Choose another product line or contact sales with a part number or equipment photo." : "Contact sales for availability, product identification, or a quotation while this range is updated."}
              </p>
            </div>
          )}
        </div>
      </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function matchesLine(product: ShopifyProduct, line: ProductLineFilter) {
  const haystack = [
    product.title,
    product.productType,
    product.vendor,
    product.description,
    ...product.tags,
  ]
    .join(" ")
    .toLowerCase();

  return line.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}
