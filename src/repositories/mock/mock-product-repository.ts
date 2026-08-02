import { products } from "@/data/products";
import type { ProductRepository } from "@/repositories/contracts/product-repository";

export const mockProductRepository: ProductRepository = {
  async list(filters) {
    return products.filter((product) => {
      const categoryMatch = !filters?.category || product.category === filters.category;
      const query = filters?.search?.trim().toLowerCase();
      const searchMatch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.categoryLabel.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  },
  async findBySlug(slug) {
    return products.find((product) => product.slug === slug) ?? null;
  },
};
