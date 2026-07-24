import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpDown, ChevronRight, Filter, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import automation from "@/assets/cat-automation.jpg";
import { ProductCard } from "@/components/shopify/ProductCard";
import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { getPaginatedProducts } from "@/lib/api/shopify.functions";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { SITE } from "@/lib/site";

type CategoryFilter = {
  label: string;
  handle: string;
  description: string;
};

const categoryFilters: CategoryFilter[] = [
  {
    label: "Asphalt Spares",
    handle: "asphalt",
    description: "Burners, conveyors, drum mixer wear parts",
  },
  {
    label: "Concrete Spares",
    handle: "concrete",
    description: "Aggregate feeding, material silos, additives, water, air and automation controls",
  },
  {
    label: "Packing Machinery",
    handle: "packing",
    description: "Sealers, rollers, belts, packing line parts",
  },
  {
    label: "Automation & Drives",
    handle: "automation",
    description: "VFDs, PLC modules, relays, sensors",
  },
  {
    label: "Home Automation and Controls",
    handle: "home-controls",
    description: "Smart relays, sensors, DIN rail supplies",
  },
  {
    label: "Control Panels & Software",
    handle: "control-panels-software",
    description: "Control panels, PLC software and support",
  },
];

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : "all",
    availability: search.availability === "available" ? "available" as const : "all" as const,
    sort: ["price-asc", "price-desc", "title"].includes(String(search.sort)) ? search.sort as "price-asc" | "price-desc" | "title" : "newest" as const,
  }),
  head: () => ({
    meta: [
      { title: "All Products | Spares Automation" },
      {
        name: "description",
        content:
          "Browse all products across asphalt, concrete, packing, automation and control categories.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/products` }],
  }),
  loader: async () => ({
    initialPage: await getPaginatedProducts({ data: { first: 48 } }),
  }),
  component: ProductsCataloguePage,
});

function productMatchesCategory(product: ShopifyProduct, handle: string) {
  const normalizedTags = product.tags.map((tag) => tag.toLowerCase());
  return normalizedTags.some(
    (tag) => tag === handle || tag === `collection:${handle}` || tag.includes(handle),
  );
}

function ProductsCataloguePage() {
  const { initialPage } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [products, setProducts] = useState<ShopifyProduct[]>(initialPage.products);
  const [pageInfo, setPageInfo] = useState(initialPage.pageInfo);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const activeCategory = search.category;
  const availability = search.availability;
  const sort = search.sort;
  const updateSearch = (updates: Partial<typeof search>) => void navigate({ search: (previous: typeof search) => ({ ...previous, ...updates }), replace: true });

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (activeCategory !== "all" && !productMatchesCategory(product, activeCategory)) {
          return false;
        }

        if (availability === "available" && !product.availableForSale) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);

        const priceA = Number(a.priceRange.minVariantPrice.amount);
        const priceB = Number(b.priceRange.minVariantPrice.amount);

        if (sort === "price-asc") return priceA - priceB;
        if (sort === "price-desc") return priceB - priceA;

        return 0;
      });
  }, [activeCategory, availability, products, sort]);

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <section className="relative flex min-h-[150px] min-w-0 items-center overflow-hidden md:min-h-[180px]">
        <img
          src={automation}
          alt="Industrial automation catalogue"
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/70 to-charcoal-deep/10" />
        <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
          <div className="mb-2 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-white/60 md:text-[10px]">
            <span className="h-px w-8 bg-accent" />
            Product Catalogue / Cart
          </div>
          <h1 className="break-words font-display text-[clamp(1.45rem,5vw,2.25rem)] font-extrabold uppercase leading-none tracking-tight text-white">
            ALL PRODUCTS <span className="text-accent">CATALOGUE</span>
          </h1>
          <p className="mt-2 max-w-2xl pr-2 text-xs leading-relaxed text-white/70 md:pr-0 md:text-sm">
            Browse the catalogue and narrow the visible products with the filters below.
          </p>
        </div>
      </section>

      <main id="main-content" className="mx-auto grid min-w-0 max-w-[1600px] grid-cols-1 gap-6 px-4 py-8 md:px-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="h-fit min-w-0 overflow-hidden border border-rule bg-surface">
          <div className="border-b border-rule p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
              <Filter className="h-4 w-4 text-accent" />
              Categories
            </div>
          </div>

          <div className="p-3">
            <button
              type="button"
              onClick={() => updateSearch({ category: "all" })}
              className={`flex w-full items-center justify-between border px-4 py-4 text-left transition-colors ${
                activeCategory === "all"
                  ? "border-accent bg-accent/10"
                  : "border-transparent hover:border-rule hover:bg-background"
              }`}
            >
              <span>
                <span className="block font-display text-sm font-bold uppercase tracking-tight">
                  All Products
                </span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                  Complete catalogue
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-accent" />
            </button>

            {categoryFilters.map((category) => (
              <button
                key={category.handle}
                type="button"
                onClick={() => updateSearch({ category: category.handle })}
                className={`mt-2 flex w-full items-center justify-between border px-4 py-4 text-left transition-colors ${
                  activeCategory === category.handle
                    ? "border-accent bg-accent/10"
                    : "border-transparent hover:border-rule hover:bg-background"
                }`}
              >
                <span>
                  <span className="block font-display text-sm font-bold uppercase tracking-tight">
                    {category.label}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                    {category.description}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-accent" />
              </button>
            ))}
          </div>
        </aside>

        <section>
          <div className="border border-rule bg-surface p-4 md:p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-muted">
                  <SlidersHorizontal className="h-4 w-4 text-accent" />
                  Refine products
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                    Showing <strong className="font-bold text-ink">{filteredProducts.length}</strong> of{" "}
                    <strong className="font-bold text-ink">{products.length}</strong> loaded
                  </span>
                  <span className="border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-accent">
                    {activeCategory === "all"
                      ? "All Products"
                      : categoryFilters.find((category) => category.handle === activeCategory)?.label}
                  </span>
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto">
                <label className="group min-w-0 border border-rule bg-background px-3 py-2 transition-colors focus-within:border-accent sm:min-w-[190px]">
                  <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-ink-muted">
                    Availability
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <select
                      aria-label="Filter by availability"
                      value={availability}
                      onChange={(event) =>
                        updateSearch({ availability: event.target.value as "all" | "available" })
                      }
                      className="min-w-0 flex-1 bg-transparent font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink focus:outline-none"
                    >
                      <option value="all">All Stock</option>
                      <option value="available">Available</option>
                    </select>
                  </span>
                </label>

                <label className="group min-w-0 border border-rule bg-background px-3 py-2 transition-colors focus-within:border-accent sm:min-w-[190px]">
                  <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-ink-muted">
                    Sort by
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <select
                      aria-label="Sort products"
                      value={sort}
                      onChange={(event) => updateSearch({ sort: event.target.value as typeof sort })}
                      className="min-w-0 flex-1 bg-transparent font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink focus:outline-none"
                    >
                      <option value="newest">Newest</option>
                      <option value="title">A-Z</option>
                      <option value="price-asc">Price Low</option>
                      <option value="price-desc">Price High</option>
                    </select>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-6 border border-dashed border-rule bg-surface px-4 py-10 text-center md:px-8 md:py-16">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight md:text-2xl">
                {products.length === 0 ? "Catalogue products are being updated" : "No products match these filters"}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-muted md:mt-4">
                {products.length === 0 ? "Contact our sales desk for availability, product identification, or a quotation while the online catalogue is updated." : "Adjust the filters or browse other categories."}
              </p>
              <button
                type="button"
                onClick={() => {
                  void navigate({ search: { category: "all", availability: "all", sort: "newest" }, replace: true });
                }}
                className="mt-6 inline-flex h-11 items-center justify-center bg-accent px-6 font-mono text-[10px] uppercase tracking-[0.22em] text-accent-foreground md:mt-8"
              >
                Reset Filters
              </button>
            </div>
          )}

          {pageInfo.hasNextPage ? (
            <div className="mt-6 text-center">
              {loadError ? <p role="alert" className="mb-3 text-sm text-red-700">{loadError}</p> : null}
              <button
                type="button"
                disabled={loadingMore}
                onClick={async () => {
                  setLoadingMore(true);
                  setLoadError("");
                  try {
                    const next = await getPaginatedProducts({ data: { first: 48, after: pageInfo.endCursor ?? undefined } });
                    setProducts((current) => [...current, ...next.products.filter((product) => !current.some((item) => item.id === product.id))]);
                    setPageInfo(next.pageInfo);
                  } catch {
                    setLoadError("More products could not be loaded. Please try again.");
                  } finally {
                    setLoadingMore(false);
                  }
                }}
                className="inline-flex h-12 items-center justify-center border border-accent bg-surface px-7 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-accent hover:bg-accent hover:text-white disabled:opacity-60"
              >
                {loadingMore ? "Loading products" : "Load more products"}
              </button>
            </div>
          ) : null}

          <div className="mt-10 border border-rule bg-charcoal-deep p-6 text-white/70">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
              Trade Support
            </div>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="max-w-2xl text-sm leading-relaxed text-white/50">
                Cannot identify the right part? Send a part number, manufacturer reference, or
                equipment photo to the procurement desk.
              </p>
              <Link
                to="/contact-us"
                className="inline-flex h-11 shrink-0 items-center justify-center border border-white/10 px-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white transition-colors hover:border-accent hover:text-accent"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
