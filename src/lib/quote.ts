import type { ShopifyCart, ShopifyMoney, ShopifyProduct, ShopifyVariant } from "@/lib/shopify/types";
import { formatMoney } from "@/lib/shopify/format";
import { SITE } from "@/lib/site";

function encodeMailto(subject: string, body: string) {
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function productQuestionMailto(product: ShopifyProduct, variant?: ShopifyVariant | null) {
  const body = [
    "Hi Spares Automation,",
    "",
    "I have a question about this product:",
    `Product: ${product.title}`,
    `Brand: ${product.technicalDetails.brand ?? product.vendor ?? "Not specified"}`,
    `MPN/Range: ${product.technicalDetails.mpnRange ?? variant?.sku ?? "Not specified"}`,
    `Variant: ${variant?.title ?? "Default"}`,
    "",
    "Question:",
  ].join("\n");

  return encodeMailto(`Product question: ${product.title}`, body);
}

export function productQuestionWhatsApp(product: ShopifyProduct, variant?: ShopifyVariant | null) {
  const message = [
    "Hi Spares Automation, I have a question about:",
    product.title,
    variant?.sku ? `SKU: ${variant.sku}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function productQuoteMailto(
  product: ShopifyProduct,
  variant?: ShopifyVariant | null,
  quantity = 1,
) {
  const body = [
    "Hi Spares Automation,",
    "",
    "Please add this item to my quote:",
    `Product: ${product.title}`,
    `Brand: ${product.technicalDetails.brand ?? product.vendor ?? "Not specified"}`,
    `MPN/Range: ${product.technicalDetails.mpnRange ?? variant?.sku ?? "Not specified"}`,
    `Variant: ${variant?.title ?? "Default"}`,
    `Quantity: ${quantity}`,
    variant?.price ? `Unit price shown: ${formatMoney(variant.price)}` : "",
    "",
    "Name:",
    "Company:",
    "Phone:",
    "Delivery postcode:",
    "Notes:",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return encodeMailto(`Quote item: ${product.title}`, body);
}

export function quoteRequestMailto(cart: ShopifyCart) {
  const lines = cart.lines.map((line, index) => {
    const sku = line.merchandise.sku ? `, SKU: ${line.merchandise.sku}` : "";
    return `${index + 1}. ${line.merchandise.product.title} (${line.merchandise.title}${sku}) x ${line.quantity} - ${formatMoney(line.cost.totalAmount)}`;
  });

  const body = [
    "Hi Spares Automation,",
    "",
    "Please quote the following items:",
    "",
    ...lines,
    "",
    `Current subtotal: ${formatMoney(cart.cost.subtotalAmount as ShopifyMoney)}`,
    "",
    "Name:",
    "Company:",
    "Phone:",
    "Delivery postcode:",
    "Notes:",
  ].join("\n");

  return encodeMailto("Quote request from website", body);
}
