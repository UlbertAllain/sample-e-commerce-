import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { makeProductSkuPreview, makeVariantId, makeVariantSkuPreview } from "@/features/catalog/product-options";
import { getAdminDb } from "@/lib/firebase/admin";
import { stripUndefined, toIso } from "@/lib/firebase/firestore";
import type { Product, ProductVariant } from "@/types/commerce";

const COLLECTION = "products";

function mapVariant(data: Record<string, unknown>, index: number): ProductVariant {
  return {
    id: String(data.id ?? makeVariantId(String(data.name ?? ""), index + 1)),
    name: String(data.name ?? `Varian ${index + 1}`),
    sku: String(data.sku ?? ""),
    price: Number(data.price ?? 0),
    compareAtPrice: data.compareAtPrice == null ? undefined : Number(data.compareAtPrice),
    wholesalePrice: data.wholesalePrice == null ? undefined : Number(data.wholesalePrice),
    wholesaleMinimum: data.wholesaleMinimum == null ? undefined : Number(data.wholesaleMinimum),
    stock: Number(data.stock ?? 0),
    minimumStock: Number(data.minimumStock ?? 0),
    weightGrams: Number(data.weightGrams ?? 0),
    isActive: data.isActive !== false,
    sold: Number(data.sold ?? 0),
  };
}

function mapProduct(id: string, data: FirebaseFirestore.DocumentData): Product {
  return {
    id,
    slug: String(data.slug ?? ""),
    name: String(data.name ?? ""),
    shortName: String(data.shortName ?? data.name ?? ""),
    category: String(data.category ?? ""),
    categoryLabel: String(data.categoryLabel ?? ""),
    description: String(data.description ?? ""),
    price: Number(data.price ?? 0),
    compareAtPrice: data.compareAtPrice == null ? undefined : Number(data.compareAtPrice),
    wholesalePrice: data.wholesalePrice == null ? undefined : Number(data.wholesalePrice),
    wholesaleMinimum: data.wholesaleMinimum == null ? undefined : Number(data.wholesaleMinimum),
    stock: Number(data.stock ?? 0),
    minimumStock: Number(data.minimumStock ?? 5),
    sku: String(data.sku ?? ""),
    weightGrams: Number(data.weightGrams ?? 0),
    image: String(data.image ?? ""),
    imagePublicId: data.imagePublicId ? String(data.imagePublicId) : undefined,
    gallery: Array.isArray(data.gallery) ? data.gallery.map(String) : [],
    galleryPublicIds: Array.isArray(data.galleryPublicIds) ? data.galleryPublicIds.map(String) : [],
    rating: Number(data.rating ?? 0),
    sold: Number(data.sold ?? 0),
    isFeatured: Boolean(data.isFeatured),
    isNew: Boolean(data.isNew),
    status: data.status === "draft" || data.status === "archived" ? data.status : "active",
    specs: Array.isArray(data.specs) ? data.specs.map((spec: { label?: unknown; value?: unknown }) => ({ label: String(spec.label ?? ""), value: String(spec.value ?? "") })) : [],
    variants: Array.isArray(data.variants) ? data.variants.map((variant: Record<string, unknown>, index: number) => mapVariant(variant, index)) : [],
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

async function ensureUniqueSku(candidate: string, ignoredId?: string) {
  const base = candidate.trim().toUpperCase().replace(/[^A-Z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 52) || "PRD-PRODUK";
  for (let counter = 1; counter <= 999; counter += 1) {
    const sku = counter === 1 ? base : `${base}-${counter}`;
    const snapshot = await getAdminDb().collection(COLLECTION).where("sku", "==", sku).limit(2).get();
    if (!snapshot.docs.some((doc) => doc.id !== ignoredId)) return sku;
  }
  throw new Error("SKU otomatis tidak dapat dibuat. Coba ubah nama produk.");
}

function assertVariantLifecycle(variants: ProductVariant[], existing: ProductVariant[] = []) {
  const existingMap = new Map(existing.map((variant) => [variant.id, variant]));
  const incomingIds = new Set(variants.map((variant) => variant.id));
  const removed = existing.find((variant) => !incomingIds.has(variant.id));
  if (removed) throw new Error(`Varian ${removed.name} tidak dapat dihapus permanen. Nonaktifkan varian agar riwayat pesanan tetap aman.`);

  const inactiveWithStock = variants.find((variant) => {
    const stock = existingMap.get(variant.id)?.stock ?? variant.stock;
    return variant.isActive === false && stock > 0;
  });
  if (inactiveWithStock) throw new Error(`Varian ${inactiveWithStock.name} masih memiliki stok. Kosongkan stok melalui menu Inventori sebelum menonaktifkannya.`);
}

function normalizeVariants(variants: ProductVariant[], productSku: string, existing: ProductVariant[] = []) {
  const existingMap = new Map(existing.map((variant) => [variant.id, variant]));
  const usedIds = new Set<string>();
  const usedSkus = new Set<string>();

  return variants.map((variant, index) => {
    let id = variant.id || makeVariantId(variant.name, index + 1);
    if (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);

    const previous = existingMap.get(variant.id);
    let sku = variant.sku?.trim() || previous?.sku || makeVariantSkuPreview(productSku, variant.name, index + 1);
    let suffix = 2;
    const baseSku = sku;
    while (usedSkus.has(sku)) {
      sku = `${baseSku}-${suffix}`;
      suffix += 1;
    }
    usedSkus.add(sku);

    return {
      ...variant,
      id,
      sku,
      stock: previous ? previous.stock : variant.stock,
      sold: previous?.sold ?? variant.sold ?? 0,
      isActive: variant.isActive !== false,
    };
  });
}

function aggregateVariantProduct(variants: ProductVariant[]) {
  const active = variants.filter((variant) => variant.isActive !== false);
  if (!active.length) throw new Error("Produk bercabang harus memiliki minimal satu varian aktif.");
  const comparePrices = active.flatMap((variant) => variant.compareAtPrice == null ? [] : [variant.compareAtPrice]);
  return {
    price: Math.min(...active.map((variant) => variant.price)),
    compareAtPrice: comparePrices.length ? Math.min(...comparePrices) : undefined,
    wholesalePrice: undefined,
    wholesaleMinimum: undefined,
    stock: active.reduce((total, variant) => total + variant.stock, 0),
    minimumStock: active.reduce((total, variant) => total + (variant.minimumStock ?? 0), 0),
    weightGrams: Math.min(...active.map((variant) => variant.weightGrams)),
    sold: active.reduce((total, variant) => total + (variant.sold ?? 0), 0),
  };
}

export async function listProducts(options?: { publicOnly?: boolean }): Promise<Product[]> {
  let query: FirebaseFirestore.Query = getAdminDb().collection(COLLECTION);
  if (options?.publicOnly) query = query.where("status", "==", "active");
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => mapProduct(doc.id, doc.data())).sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export async function getProduct(id: string): Promise<Product | null> {
  const snapshot = await getAdminDb().collection(COLLECTION).doc(id).get();
  return snapshot.exists ? mapProduct(snapshot.id, snapshot.data() ?? {}) : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const snapshot = await getAdminDb().collection(COLLECTION).where("slug", "==", slug).limit(1).get();
  const doc = snapshot.docs[0];
  return doc ? mapProduct(doc.id, doc.data()) : null;
}

export async function createProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  const db = getAdminDb();
  const duplicate = await db.collection(COLLECTION).where("slug", "==", input.slug).limit(1).get();
  if (!duplicate.empty) throw new Error("Slug produk sudah digunakan.");

  const sku = await ensureUniqueSku(input.sku || makeProductSkuPreview(input.category, input.name));
  assertVariantLifecycle(input.variants ?? []);
  const variants = normalizeVariants(input.variants ?? [], sku);
  const variantAggregate = variants.length ? aggregateVariantProduct(variants) : {};
  const ref = db.collection(COLLECTION).doc();

  await ref.set(stripUndefined({
    ...input,
    ...variantAggregate,
    sku,
    variants,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }));
  const created = await ref.get();
  return mapProduct(created.id, created.data() ?? {});
}

export async function updateProduct(id: string, input: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<Product> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  const existingSnapshot = await ref.get();
  if (!existingSnapshot.exists) throw new Error("NOT_FOUND");
  const existing = mapProduct(existingSnapshot.id, existingSnapshot.data() ?? {});

  if (input.slug) {
    const duplicate = await getAdminDb().collection(COLLECTION).where("slug", "==", input.slug).limit(2).get();
    if (duplicate.docs.some((doc) => doc.id !== id)) throw new Error("Slug produk sudah digunakan.");
  }

  const sku = input.sku?.trim()
    ? await ensureUniqueSku(input.sku, id)
    : existing.sku || await ensureUniqueSku(makeProductSkuPreview(input.category ?? existing.category, input.name ?? existing.name), id);

  if (input.variants !== undefined) assertVariantLifecycle(input.variants, existing.variants ?? []);

  const variants = input.variants === undefined ? undefined : normalizeVariants(input.variants, sku, existing.variants ?? []);
  const variantAggregate = variants?.length ? aggregateVariantProduct(variants) : {};

  await ref.update(stripUndefined({
    ...input,
    ...variantAggregate,
    sku,
    ...(variants === undefined ? {} : { variants }),
    updatedAt: FieldValue.serverTimestamp(),
  }));
  const updated = await ref.get();
  return mapProduct(updated.id, updated.data() ?? {});
}

export async function archiveProduct(id: string): Promise<void> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) throw new Error("NOT_FOUND");
  await ref.update({ status: "archived", updatedAt: FieldValue.serverTimestamp() });
}
