import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  Mail,
  MessageCircle,
  Minus,
  PackageCheck,
  PlayCircle,
  Plus,
} from "lucide-react";
import { useState } from "react";

import { AddToCartButton } from "@/components/shopify/AddToCartButton";
import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { formatMoney, shopifyImageUrl } from "@/lib/shopify/format";
import type { ShopifyProduct, ShopifyVariant } from "@/lib/shopify/types";
import { SITE } from "@/lib/site";
import { productQuestionMailto, productQuestionWhatsApp, productQuoteMailto } from "@/lib/quote";

type ProductDetailProps = {
  product: ShopifyProduct;
};

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants.find((variant) => variant.availableForSale)?.id ?? product.variants[0]?.id,
  );
  const [quantity, setQuantity] = useState(1);
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  const gallery = product.images.length
    ? product.images
    : product.featuredImage
      ? [product.featuredImage]
      : [];
  const [activeImage, setActiveImage] = useState(gallery[0]);
  const brand = product.technicalDetails.brand ?? product.vendor ?? "Spares Automation";
  const mpnRange = product.technicalDetails.mpnRange ?? selectedVariant?.sku ?? "Ask for MPN";

  return (
    <div className="min-h-screen bg-background text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: product.title, description: product.description, image: product.images.map((image) => image.url), sku: selectedVariant?.sku || undefined, brand: { "@type": "Brand", name: brand }, offers: selectedVariant ? { "@type": "Offer", price: selectedVariant.price.amount, priceCurrency: selectedVariant.price.currencyCode, availability: selectedVariant.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${SITE.url}/products/${product.handle}` } : undefined }).replace(/</g, "\\u003c") }} />
      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-[1600px]">
        <div className="border-b border-rule bg-surface px-4 py-4 md:px-6 lg:px-10">
          <Link
            to="/products"
            search={{ category: "all", availability: "all", sort: "newest" }}
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Catalogue
          </Link>
        </div>

        <section className="grid grid-cols-1 gap-px bg-rule lg:grid-rows-[auto_auto] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Row 1: Product Gallery and Product Info */}
          <ProductGallery
            productTitle={product.title}
            gallery={gallery}
            activeImage={activeImage}
            onSelectImage={setActiveImage}
          />

          <section className="bg-surface p-4 md:p-6 lg:row-span-2 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <StockBadge variant={selectedVariant} product={product} />
            </div>

            <h1 className="mt-4 max-w-3xl break-words font-display text-[1.45rem] font-bold leading-[1.18] tracking-[-0.015em] text-ink sm:text-[1.7rem] md:mt-5 md:text-[2rem] lg:text-[2.35rem]">
              {product.title}
            </h1>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <SpecBlock label="Brand" value={brand} />
              <SpecBlock label="MPN / Range" value={mpnRange} />
              <SpecBlock label="Product line" value={product.productType || "Industrial part"} />
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="font-display text-2xl font-bold text-ink md:text-[1.75rem]">
                {selectedVariant ? formatMoney(selectedVariant.price) : "Price on request"}
              </div>
              {selectedVariant?.compareAtPrice ? (
                <div className="pb-1 font-mono text-sm uppercase tracking-[0.18em] text-ink-muted line-through">
                  {formatMoney(selectedVariant.compareAtPrice)}
                </div>
              ) : null}
            </div>

            <ProductDescription product={product} />

            {product.variants.length > 1 ? (
              <div className="mt-6">
                <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
                  Variant
                </label>
                <select
                  value={selectedVariantId}
                  onChange={(event) => setSelectedVariantId(event.target.value)}
                  className="mt-3 h-12 w-full border border-rule bg-background px-4 font-mono text-sm text-ink focus:border-accent focus:outline-none"
                >
                  {product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id} disabled={!variant.availableForSale}>
                      {variant.title} {variant.sku ? `- ${variant.sku}` : ""}{" "}
                      {variant.availableForSale ? "" : "(Sold out)"}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                disabled={!selectedVariant?.availableForSale}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <AddToCartButton
                  variantId={selectedVariant?.id ?? ""}
                  quantity={quantity}
                  disabled={!selectedVariant?.availableForSale}
                  className="inline-flex h-13 items-center justify-center gap-2 bg-accent px-5 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedVariant?.availableForSale ? "Add to Cart" : "Sold out"}
                </AddToCartButton>
                <a
                  href={productQuoteMailto(product, selectedVariant, quantity)}
                  className="inline-flex h-13 items-center justify-center gap-2 border border-accent bg-accent/5 px-5 font-mono text-[11px] uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <FileText className="h-4 w-4" />
                  Request quote by email
                </a>
                <Link
                  to="/cart"
                  className="inline-flex h-13 items-center justify-center border border-rule px-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  View Cart
                </Link>
              </div>
            </div>

            <QuestionActions product={product} variant={selectedVariant} />
          </section>

          {/* Row 2: Product Resources, same width as Product Gallery */}
          <div className="bg-surface">
            <ProductResources product={product} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function QuantityStepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const decrease = () => onChange(Math.max(1, value - 1));
  const increase = () => onChange(Math.min(99, value + 1));

  return (
    <div className="flex h-13 w-full items-stretch border border-rule bg-surface sm:w-[210px]">
      <div className="flex min-w-[52px] items-center justify-center border-r border-rule font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
        Qty
      </div>
      <button
        type="button"
        onClick={decrease}
        disabled={disabled || value <= 1}
        className="flex w-11 items-center justify-center text-ink transition-colors hover:bg-background hover:text-accent disabled:cursor-not-allowed disabled:text-ink-muted/35"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        value={value}
        onChange={(event) => {
          const nextValue = Number.parseInt(event.target.value, 10);
          if (Number.isNaN(nextValue)) {
            onChange(1);
            return;
          }
          onChange(Math.min(99, Math.max(1, nextValue)));
        }}
        disabled={disabled}
        inputMode="numeric"
        aria-label="Quantity"
        className="w-12 border-x border-rule bg-transparent text-center font-display text-base font-bold text-ink focus:outline-none disabled:text-ink-muted"
      />
      <button
        type="button"
        onClick={increase}
        disabled={disabled || value >= 99}
        className="flex w-11 items-center justify-center text-ink transition-colors hover:bg-background hover:text-accent disabled:cursor-not-allowed disabled:text-ink-muted/35"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function ProductGallery({
  productTitle,
  gallery,
  activeImage,
  onSelectImage,
}: {
  productTitle: string;
  gallery: ShopifyProduct["images"];
  activeImage: ShopifyProduct["images"][number] | undefined;
  onSelectImage: (image: ShopifyProduct["images"][number]) => void;
}) {
  return (
    <section className="bg-surface p-4 md:p-6 lg:p-8">
      <div className="aspect-[4/3] max-h-[620px] overflow-hidden bg-[oklch(0.96_0.005_250)]">
        {activeImage ? (
          <img
            src={shopifyImageUrl(activeImage.url, 1000)}
            srcSet={`${shopifyImageUrl(activeImage.url, 480)} 480w, ${shopifyImageUrl(activeImage.url, 800)} 800w, ${shopifyImageUrl(activeImage.url, 1200)} 1200w`}
            sizes="(min-width: 1024px) 48vw, 100vw"
            width={activeImage.width ?? 1000}
            height={activeImage.height ?? 1000}
            alt={activeImage.altText ?? productTitle}
            className="h-full w-full object-contain mix-blend-multiply"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
            Image pending
          </div>
        )}
      </div>

      {gallery.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 md:gap-3">
          {gallery.map((image) => (
            <button
              key={image.url}
              type="button"
              onClick={() => onSelectImage(image)}
              className={`aspect-square overflow-hidden border bg-background transition-colors hover:border-accent ${
                activeImage?.url === image.url ? "border-accent" : "border-rule"
              }`}
              aria-label={`View ${image.altText ?? productTitle}`}
            >
              <img
                src={shopifyImageUrl(image.url, 240)}
                width={image.width ?? 240}
                height={image.height ?? 240}
                loading="lazy"
                alt={image.altText ?? productTitle}
                className="h-full w-full object-contain mix-blend-multiply"
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function StockBadge({ variant, product }: { variant?: ShopifyVariant; product: ShopifyProduct }) {
  const quantity = variant?.quantityAvailable;
  const hasExactStock = typeof quantity === "number" && quantity > 0;
  const isAvailable = variant?.availableForSale || product.availableForSale;

  if (!isAvailable) {
    return (
      <span className="inline-flex min-h-10 items-center gap-2 border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700">
        <PackageCheck className="h-3.5 w-3.5" />
        Out of stock
      </span>
    );
  }

  return (
    <div className="inline-flex min-h-10 max-w-full flex-wrap items-center gap-x-2 gap-y-1 border border-accent/30 bg-accent/5 px-3 text-sm text-ink">
      <PackageCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <span className="font-semibold">
        {hasExactStock ? `${quantity} in stock` : "Available to order"}
      </span>
      <span aria-hidden="true" className="hidden h-4 w-px bg-rule sm:block" />
      <span className="text-xs text-ink-muted">Lead time and dispatch confirmed at order</span>
    </div>
  );
}

function SpecBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-rule bg-surface p-3.5 shadow-[inset_3px_0_0_var(--color-accent)] md:p-4">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </div>
      <div className="mt-2 break-words font-display text-sm font-semibold leading-snug text-ink md:text-[15px]">
        {value}
      </div>
    </div>
  );
}

function ProductDescription({ product }: { product: ShopifyProduct }) {
  if (product.descriptionHtml) {
    return (
      <div
        className="mt-6 max-w-3xl space-y-4 text-sm leading-7 text-ink-muted [&_a]:text-accent [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
      />
    );
  }

  return (
    <p className="mt-6 max-w-3xl text-sm leading-7 text-ink-muted">
      {product.description || "Product details are being prepared. Contact us for specification help."}
    </p>
  );
}

function extractYouTubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function ProductResources({ product }: { product: ShopifyProduct }) {
  const [showVideo, setShowVideo] = useState(false);
  const resources = [
    ...product.technicalDetails.datasheets.map((resource) => ({ ...resource, type: "Datasheet" })),
    ...product.technicalDetails.manuals.map((resource) => ({ ...resource, type: "Manual" })),
  ];

  const hasAnyResource = 
    product.technicalDetails.setupVideoUrl || 
    product.technicalDetails.videoGuide || 
    product.technicalDetails.pdfGuide || 
    resources.length > 0;

  if (!hasAnyResource) return null;

  const videoGuide = product.technicalDetails.videoGuide;
  const youtubeVideoId = videoGuide ? extractYouTubeVideoId(videoGuide.url) : null;

  return (
    <section className="mt-10 border-t border-rule pt-8">
      <h2 className="font-display text-lg font-bold uppercase tracking-tight">Product support</h2>
      
      {/* Video Preview (if YouTube) */}
      {videoGuide && youtubeVideoId && showVideo ? (
        <div className="mt-6 border border-rule overflow-hidden bg-background">
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
              title={videoGuide.text}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="w-full h-full"
            />
          </div>
        </div>
      ) : videoGuide && youtubeVideoId ? (
        <div className="mt-6 border border-rule bg-background p-5">
          <p className="text-sm leading-6 text-ink-muted">This video is hosted by YouTube. Loading it may allow YouTube to store or access information on your device.</p>
          <button type="button" onClick={() => setShowVideo(true)} className="mt-4 inline-flex h-11 items-center gap-2 bg-charcoal-deep px-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white hover:bg-accent">
            <PlayCircle aria-hidden="true" className="h-4 w-4" /> Load YouTube video
          </button>
        </div>
      ) : null}
      
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {product.technicalDetails.setupVideoUrl ? (
          <a
            href={product.technicalDetails.setupVideoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-rule bg-background p-4 text-sm transition-colors hover:border-accent hover:text-accent"
          >
            <PlayCircle className="h-5 w-5 text-accent" />
            Setup video
          </a>
        ) : null}
        {videoGuide ? (
          <a
            href={videoGuide.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-rule bg-background p-4 text-sm transition-colors hover:border-accent hover:text-accent"
          >
            <PlayCircle className="h-5 w-5 text-accent" />
            {videoGuide.text}
          </a>
        ) : null}
        {product.technicalDetails.pdfGuide ? (
          <a
            href={product.technicalDetails.pdfGuide.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-rule bg-background p-4 text-sm transition-colors hover:border-accent hover:text-accent"
          >
            <FileText className="h-5 w-5 text-accent" />
            {product.technicalDetails.pdfGuide.text}
          </a>
        ) : null}
        {resources.map((resource) => (
          <a
            key={`${resource.type}-${resource.url}`}
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-rule bg-background p-4 text-sm transition-colors hover:border-accent hover:text-accent"
          >
            <FileText className="h-5 w-5 text-accent" />
            {resource.type}: {resource.label}
          </a>
        ))}
      </div>
    </section>
  );
}

function QuestionActions({
  product,
  variant,
}: {
  product: ShopifyProduct;
  variant?: ShopifyVariant;
}) {
  return (
    <section className="mt-10 border-t border-rule pt-8">
      <h2 className="font-display text-lg font-bold uppercase tracking-tight">Got a question?</h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a
          href={productQuestionMailto(product, variant)}
          className="inline-flex h-12 items-center justify-center gap-2 border border-rule px-5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors hover:border-accent hover:text-accent"
        >
          <Mail className="h-4 w-4" />
          Email question
        </a>
        <a
          href={productQuestionWhatsApp(product, variant)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 border border-rule px-5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors hover:border-accent hover:text-accent"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp question
        </a>
      </div>
    </section>
  );
}
