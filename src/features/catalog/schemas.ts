import { z } from "zod";

const optionalMoney = z.union([z.coerce.number().int().nonnegative(), z.literal("")]).optional().transform((value) => value === "" ? undefined : value);

const productVariantSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(100),
  sku: z.string().trim().max(80).default(""),
  price: z.coerce.number().int().positive(),
  compareAtPrice: optionalMoney,
  wholesalePrice: optionalMoney,
  wholesaleMinimum: z.union([z.coerce.number().int().positive(), z.literal("")]).optional().transform((value) => value === "" ? undefined : value),
  stock: z.coerce.number().int().nonnegative(),
  minimumStock: z.coerce.number().int().nonnegative().default(0),
  weightGrams: z.coerce.number().int().positive(),
  isActive: z.boolean().default(true),
  sold: z.coerce.number().int().nonnegative().default(0),
});

export const productSchema = z.object({
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung."),
  name: z.string().trim().min(3).max(180),
  shortName: z.string().trim().min(2).max(80),
  category: z.string().trim().min(1),
  categoryLabel: z.string().trim().min(1).max(80),
  description: z.string().trim().min(10).max(3000),
  price: z.coerce.number().int().positive(),
  compareAtPrice: optionalMoney,
  wholesalePrice: optionalMoney,
  wholesaleMinimum: z.union([z.coerce.number().int().positive(), z.literal("")]).optional().transform((value) => value === "" ? undefined : value),
  stock: z.coerce.number().int().nonnegative(),
  minimumStock: z.coerce.number().int().nonnegative().default(5),
  sku: z.string().trim().max(60).default(""),
  weightGrams: z.coerce.number().int().positive(),
  image: z.string().trim().min(1).refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), "URL gambar tidak valid."),
  imagePublicId: z.string().trim().optional(),
  gallery: z.array(z.string().trim().min(1).refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), "URL galeri tidak valid.")).max(10).default([]),
  galleryPublicIds: z.array(z.string()).max(10).default([]),
  rating: z.coerce.number().min(0).max(5).default(0),
  sold: z.coerce.number().int().nonnegative().default(0),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  status: z.enum(["draft", "active", "archived"]).default("active"),
  specs: z.array(z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(160) })).max(20).default([]),
  variants: z.array(productVariantSchema).max(50).default([]),
});

export const categorySchema = z.object({
  id: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(3).max(240),
  icon: z.string().trim().min(1).max(8),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(999),
});

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().trim().min(1).max(80).optional(),
  type: z.enum(["adjustment-in", "adjustment-out", "return"]),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().trim().min(5).max(300),
});
