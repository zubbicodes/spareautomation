import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Filter, Search, SlidersHorizontal } from "lucide-react";
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
    description: "Aggregate, silos, additives, water, air controls",
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
    label: "Home Controls",
    handle: "home-controls",
    description: "Smart relays, sensors, DIN rail supplies",
  },
  {
    label: "New Arrivals",
    handle: "new-arrivals",
    description: "Recently added catalogue items",
  },
];

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : "all",
    q: typeof search.q === "string" ? search.q : "",
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
  const [products, setProducts] = useState(initialPage.products);
  const [pageInfo, setPageInfo] = useState(initialPage.pageInfo);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const activeCategory = search.category;
  const searchTerm = search.q;
  const availability = search.availability;
  const sort = search.sort;
  const updateSearch = (updates: Partial<typeof search>) => void navigate({ search: (previous) => ({ ...previous, ...updates }), replace: true });

  const filteredProducts = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return products
      .filter((product) => {
        if (activeCategory !== "all" && !productMatchesCategory(product, activeCategory)) {
          return false;
        }

        if (availability === "available" && !product.availableForSale) {
          return false;
        }

        if (!needle) return true;

        return [
          product.title,
          product.vendor,
          product.productType,
          product.description,
          ...product.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);

        const priceA = Number(a.priceRange.minVariantPrice.amount);
        const priceB = Number(b.priceRange.minVariantPrice.amount);

        if (sort === "price-asc") return priceA - priceB;
        if (sort === "price-desc") return priceB - priceA;

        return 0;
      });
  }, [activeCategory, availability, products, searchTerm, sort]);

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <section className="relative flex min-h-[220px] min-w-0 items-end overflow-hidden md:min-h-[280px]">
        <img
          src={automation}
          alt="Industrial automation catalogue"
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/70 to-charcoal-deep/10" />
        <div className="relative mx-auto w-full max-w-[1600px] px-4 py-10 md:px-6 md:py-12">
          <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">
            <span className="h-px w-8 bg-accent" />
            Product Catalogue / Cart
          </div>
          <h1 className="break-words font-display text-[clamp(1.85rem,8vw,3.5rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-white">
            ALL PRODUCTS <span className="text-accent">CATALOGUE</span>
          </h1>
          <p className="mt-4 max-w-2xl pr-2 text-sm leading-relaxed text-white/70 md:pr-0 md:text-[15px]">
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
          <div className="border border-rule bg-surface p-3 md:p-4">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-muted">
              Filter current results
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_180px_180px]">
              <label className="flex h-10 items-center gap-3 border border-rule bg-background px-3 transition-colors focus-within:border-accent md:h-11">
                <Search className="h-4 w-4 text-ink-muted" />
                <input
                  aria-label="Filter current product results"
                  value={searchTerm}
                  onChange={(event) => updateSearch({ q: event.target.value })}
                  type="search"
                  placeholder="Search within results..."
                  className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-ink placeholder:text-ink-muted focus:outline-none"
                />
              </label>

              <label className="flex h-10 items-center gap-3 border border-rule bg-background px-3 md:h-11">
                <SlidersHorizontal className="h-4 w-4 text-ink-muted" />
                <select
                  aria-label="Filter by availability"
                  value={availability}
                  onChange={(event) =>
                    updateSearch({ availability: event.target.value as "all" | "available" })
                  }
                  className="min-w-0 flex-1 bg-transparent font-mono text-[11px] uppercase tracking-[0.16em] text-ink focus:outline-none"
                >
                  <option value="all">All Stock</option>
                  <option value="available">Available</option>
                </select>
              </label>

              <label className="flex h-10 items-center gap-3 border border-rule bg-background px-3 md:h-11">
                <select
                  aria-label="Sort products"
                  value={sort}
                  onChange={(event) => updateSearch({ sort: event.target.value as typeof sort })}
                  className="min-w-0 flex-1 bg-transparent font-mono text-[11px] uppercase tracking-[0.16em] text-ink focus:outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="title">A-Z</option>
                  <option value="price-asc">Price Low</option>
                  <option value="price-desc">Price High</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredProducts.length} from {products.length} loaded products
              </span>
              <span>
                Active filter:{" "}
                {activeCategory === "all"
                  ? "All Products"
                  : categoryFilters.find((category) => category.handle === activeCategory)?.label}
              </span>
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
                {products.length === 0 ? "Contact our sales desk for availability, product identification, or a quotation while the online catalogue is updated." : "Clear the search term, adjust filters, or browse other categories."}
              </p>
              <button
                type="button"
                onClick={() => {
                  void navigate({ search: { category: "all", q: "", availability: "all", sort: "newest" }, replace: true });
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
