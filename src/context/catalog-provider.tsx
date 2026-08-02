"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { categories as fallbackCategories } from "@/data/categories";
import { products as fallbackProducts } from "@/data/products";
import { apiFetch } from "@/lib/api/client";
import type { Category, Product } from "@/types/commerce";

type CatalogContextValue = {
  products: Product[];
  categories: Category[];
  loading: boolean;
  refresh: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
};

type CatalogSnapshot = {
  products: Product[];
  categories: Category[];
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

async function fetchCatalogSnapshot(): Promise<CatalogSnapshot> {
  const [products, categories] = await Promise.all([
    apiFetch<Product[]>("/api/store/products"),
    apiFetch<Category[]>("/api/store/categories"),
  ]);
  return { products, categories };
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await fetchCatalogSnapshot();
      setProducts(snapshot.products);
      setCategories(snapshot.categories);
    } catch (error) {
      console.error("Catalog backend belum tersedia; memakai data lokal sementara.", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchCatalogSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        setProducts(snapshot.products);
        setCategories(snapshot.categories);
      })
      .catch((error: unknown) => {
        console.error("Catalog backend belum tersedia; memakai data lokal sementara.", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CatalogContextValue>(() => ({
    products,
    categories,
    loading,
    refresh,
    getProductById(id) {
      return products.find((product) => product.id === id);
    },
  }), [categories, loading, products, refresh]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog harus digunakan di dalam CatalogProvider");
  return context;
}
