import type { Product, ProductVariant } from "@/types/commerce";

function normalizeToken(value: string, fallback: string, maxLength = 24) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength);
  return normalized || fallback;
}

export function makeProductSkuPreview(category: string, name: string) {
  const categoryCode = normalizeToken(category, "PRD").replace(/-/g, "").slice(0, 3).padEnd(3, "X");
  const nameCode = normalizeToken(name, "PRODUK").split("-").filter(Boolean).slice(0, 3).join("-").slice(0, 22);
  return `${categoryCode}-${nameCode || "PRODUK"}`;
}

export function makeVariantId(name: string, fallbackIndex = 1) {
  return normalizeToken(name, `VARIAN-${fallbackIndex}`).toLowerCase();
}

export function makeVariantSkuPreview(productSku: string, variantName: string, fallbackIndex = 1) {
  const base = normalizeToken(productSku, "PRD-PRODUK", 52);
  const variant = normalizeToken(variantName, `VAR-${fallbackIndex}`).replace(/-/g, "").slice(0, 12);
  return `${base}-${variant}`;
}

export function getActiveVariants(product: Product) {
  return (product.variants ?? []).filter((variant) => variant.isActive !== false);
}

export function getVariant(product: Product, variantId?: string) {
  const variants = getActiveVariants(product);
  if (!variants.length) return undefined;
  if (variantId) return variants.find((variant) => variant.id === variantId);
  return variants[0];
}

export function getSellableStock(product: Product, variant?: ProductVariant) {
  return variant ? variant.stock : product.stock;
}

export function getSellablePrice(product: Product, quantity: number, variant?: ProductVariant) {
  const price = variant?.price ?? product.price;
  const wholesalePrice = variant?.wholesalePrice ?? product.wholesalePrice;
  const wholesaleMinimum = variant?.wholesaleMinimum ?? product.wholesaleMinimum;
  return wholesalePrice != null && wholesaleMinimum != null && quantity >= wholesaleMinimum ? wholesalePrice : price;
}

export function getDisplayPrice(product: Product) {
  const variants = getActiveVariants(product);
  if (!variants.length) return product.price;
  return Math.min(...variants.map((variant) => variant.price));
}

export function getDisplayStock(product: Product) {
  const variants = getActiveVariants(product);
  if (!variants.length) return product.stock;
  return variants.reduce((total, variant) => total + variant.stock, 0);
}
