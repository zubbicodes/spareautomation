import type { ShopifyCart, ShopifyImage, ShopifyMoney, ShopifyProduct, ShopifyVariant } from "./types";

export const SHOPIFY_QUOTE_STORAGE_KEY = "spares_automation_quote";
export const SHOPIFY_QUOTE_UPDATED_EVENT = "shopify-quote-updated";

export type StoredQuoteItem = {
  variantId: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  sku: string | null;
  price: ShopifyMoney;
  image: ShopifyImage | null;
  quantity: number;
};

function isStoredQuoteItem(value: unknown): value is StoredQuoteItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<StoredQuoteItem>;
  return (
    typeof item.variantId === "string" &&
    typeof item.productHandle === "string" &&
    typeof item.productTitle === "string" &&
    typeof item.variantTitle === "string" &&
    typeof item.quantity === "number" &&
    item.quantity >= 1 &&
    item.quantity <= 99 &&
    typeof item.price?.amount === "string" &&
    typeof item.price?.currencyCode === "string"
  );
}

export function getStoredQuote(): StoredQuoteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(SHOPIFY_QUOTE_STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter(isStoredQuoteItem) : [];
  } catch {
    return [];
  }
}

export function setStoredQuote(items: StoredQuoteItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SHOPIFY_QUOTE_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(SHOPIFY_QUOTE_UPDATED_EVENT));
}

export function clearStoredQuote() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SHOPIFY_QUOTE_STORAGE_KEY);
  window.dispatchEvent(new Event(SHOPIFY_QUOTE_UPDATED_EVENT));
}

export function addProductToStoredQuote(
  product: ShopifyProduct,
  variant: ShopifyVariant,
  quantity: number,
) {
  const items = getStoredQuote();
  const existing = items.find((item) => item.variantId === variant.id);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + quantity);
  } else {
    items.push({
      variantId: variant.id,
      productHandle: product.handle,
      productTitle: product.title,
      variantTitle: variant.title,
      sku: variant.sku,
      price: variant.price,
      image: product.featuredImage,
      quantity: Math.min(99, Math.max(1, quantity)),
    });
  }
  setStoredQuote(items);
}

export function addCartToStoredQuote(cart: ShopifyCart) {
  const items = getStoredQuote();
  for (const line of cart.lines) {
    const existing = items.find((item) => item.variantId === line.merchandise.id);
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + line.quantity);
      continue;
    }
    items.push({
      variantId: line.merchandise.id,
      productHandle: line.merchandise.product.handle,
      productTitle: line.merchandise.product.title,
      variantTitle: line.merchandise.title,
      sku: line.merchandise.sku,
      price: line.merchandise.price,
      image: line.merchandise.product.featuredImage,
      quantity: line.quantity,
    });
  }
  setStoredQuote(items);
}
