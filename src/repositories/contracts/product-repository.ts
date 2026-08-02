import type { Product, ProductCategory } from "@/types/commerce";

export interface ProductRepository {
  list(filters?: { category?: ProductCategory; search?: string }): Promise<Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
}
