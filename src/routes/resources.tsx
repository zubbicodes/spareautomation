import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, FileText, PlayCircle } from "lucide-react";

import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { SupportRequestForm } from "@/components/shopify/SupportRequestForm";
import { getResourceProducts } from "@/lib/api/shopify.functions";
import { pageHead } from "@/lib/seo";
import type { ShopifyProduct } from "@/lib/shopify/types";

type ResourceLink = {
  label: string;
  url: string;
  type: "video" | "document";
  detail: string;
};

type ResourceProduct = {
  handle: string;
  title: string;
  resources: ResourceLink[];
};

type ResourceGroup = {
  category: string;
  slug: string;
  products: ResourceProduct[];
  resourceCount: number;
};

export const Route = createFileRoute("/resources")({
  head: () =>
    pageHead(
      "PDFs, Manuals and Videos",
      "Browse product videos, technical PDFs, datasheets, and manuals arranged by equipment category.",
      "/resources",
    ),
  loader: async () => ({ products: await getResourceProducts({ data: { first: 100 } }) }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { products } = Route.useLoaderData();
  const groups = groupProductResources(products);

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <main id="main-content">
        <section className="border-b border-rule bg-charcoal-deep text-white">
          <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-6 md:py-12">
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/45 md:text-[10px]">
              Resource Library
            </div>
            <h1 className="mt-3 max-w-4xl font-display text-2xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl">
              PDFs, manuals &amp; videos
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65 md:text-base">
              Find product support files arranged by category, including burner PDFs and videos,
              installation guides, datasheets, and equipment manuals.
            </p>
          </div>
        </section>

        {groups.length ? (
          <>
            <nav aria-label="Resource categories" className="border-b border-rule bg-surface">
              <div className="mx-auto flex max-w-[1400px] gap-2 overflow-x-auto px-4 py-4 md:px-6">
                {groups.map((group) => (
                  <a
                    key={group.slug}
                    href={`#${group.slug}`}
                    className="shrink-0 border border-rule bg-background px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ink-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    {group.category}
                    <span className="ml-2 text-accent">{group.resourceCount}</span>
                  </a>
                ))}
              </div>
            </nav>

            <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-8 md:px-6 md:py-10">
              {groups.map((group) => (
                <section
                  key={group.slug}
                  id={group.slug}
                  aria-labelledby={`${group.slug}-title`}
                  className="scroll-mt-4 border border-rule bg-surface"
                >
                  <div className="flex flex-col gap-2 border-b border-rule bg-charcoal-deep px-5 py-5 text-white md:flex-row md:items-center md:justify-between md:px-6">
                    <h2
                      id={`${group.slug}-title`}
                      className="font-display text-xl font-bold uppercase tracking-tight md:text-2xl"
                    >
                      {group.category} <span className="text-accent">PDFs &amp; Videos</span>
                    </h2>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/55">
                      {group.resourceCount} {group.resourceCount === 1 ? "resource" : "resources"}
                    </span>
                  </div>

                  <div className="grid gap-px bg-rule md:grid-cols-2">
                    {group.products.map((product) => (
                      <article key={product.handle} className="bg-background p-5 md:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                              Product resources
                            </div>
                            <h3 className="mt-2 font-display text-base font-bold leading-snug text-ink md:text-lg">
                              {product.title}
                            </h3>
                          </div>
                          <Link
                            to="/products/$handle"
                            params={{ handle: product.handle }}
                            className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-accent hover:underline"
                          >
                            View product
                          </Link>
                        </div>

                        <div className="mt-5 grid gap-3">
                          {product.resources.map((resource) => (
                            <a
                              key={`${resource.type}-${resource.url}`}
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex min-h-16 items-center gap-3 border border-rule bg-surface p-3.5 transition-colors hover:border-accent"
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white">
                                {resource.type === "video" ? (
                                  <PlayCircle className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                  <FileText className="h-5 w-5" aria-hidden="true" />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                                  {resource.detail}
                                </span>
                                <span className="mt-1 block break-words text-sm font-semibold text-ink group-hover:text-accent">
                                  {resource.label}
                                </span>
                              </span>
                              <ExternalLink className="h-4 w-4 shrink-0 text-ink-muted group-hover:text-accent" aria-hidden="true" />
                            </a>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <section className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-14">
            <div className="border border-dashed border-rule bg-surface px-5 py-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl font-bold uppercase tracking-tight">
                Resource library is being updated
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
                No public files are currently assigned to products. Request the correct PDF,
                manual, or video using the form below.
              </p>
            </div>
          </section>
        )}

        <SupportRequestForm kind="resources" />
      </main>

      <SiteFooter />
    </div>
  );
}

function groupProductResources(products: ShopifyProduct[]): ResourceGroup[] {
  const grouped = new Map<string, ResourceProduct[]>();

  for (const product of products) {
    const resources = productResources(product);
    if (!resources.length) continue;

    const category = product.productType.trim() || "General Product";
    const categoryProducts = grouped.get(category) ?? [];
    categoryProducts.push({ handle: product.handle, title: product.title, resources });
    grouped.set(category, categoryProducts);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, categoryProducts]) => ({
      category,
      slug: `resources-${slugify(category)}`,
      products: categoryProducts.sort((left, right) => left.title.localeCompare(right.title)),
      resourceCount: categoryProducts.reduce((total, product) => total + product.resources.length, 0),
    }));
}

function productResources(product: ShopifyProduct): ResourceLink[] {
  const { videoGuide, setupVideoUrl, pdfGuide, datasheets, manuals } = product.technicalDetails;
  const resources: ResourceLink[] = [];

  if (videoGuide) {
    resources.push({ label: videoGuide.text || "Video guide", url: videoGuide.url, type: "video", detail: "Video guide" });
  }
  if (setupVideoUrl && setupVideoUrl !== videoGuide?.url) {
    resources.push({ label: "Setup video", url: setupVideoUrl, type: "video", detail: "Setup video" });
  }
  if (pdfGuide) {
    resources.push({ label: pdfGuide.text || "PDF guide", url: pdfGuide.url, type: "document", detail: "PDF guide" });
  }
  resources.push(
    ...datasheets.map((resource) => ({ ...resource, type: "document" as const, detail: "Datasheet" })),
    ...manuals.map((resource) => ({ ...resource, type: "document" as const, detail: "Manual" })),
  );

  return resources;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
