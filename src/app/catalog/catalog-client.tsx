"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type ChangeEvent } from "react";
import { ProductCard } from "@/components/store/product-card";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import type { ProductCategory } from "@/types/commerce";

type SortMode = "featured" | "price-asc" | "price-desc" | "popular";

export function CatalogClient() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") as ProductCategory | null;
  const [category, setCategory] = useState<ProductCategory | "all">(initialCategory ?? "all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("featured");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products
      .filter((product) => category === "all" || product.category === category)
      .filter((product) => !normalized || `${product.name} ${product.categoryLabel} ${product.sku}`.toLowerCase().includes(normalized))
      .sort((a, b) => {
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        if (sort === "popular") return b.sold - a.sold;
        return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
      });
  }, [category, query, sort]);

  return (
    <>
      <section className="page-hero"><div className="shell"><span className="eyebrow eyebrow--light">Koleksi lengkap</span><h1>Katalog perlengkapan akuarium</h1><p>Pilih produk berdasarkan kebutuhan filtrasi, sirkulasi, pencahayaan, dekorasi, dan perawatan.</p></div></section>
      <section className="section shell catalog-layout">
        <aside className="catalog-sidebar">
          <div className="sidebar-title"><SlidersHorizontal size={18} /> Filter kategori</div>
          <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>Semua produk <span>{products.length}</span></button>
          {categories.map((item) => <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.name}<span>{products.filter((p) => p.category === item.id).length}</span></button>)}
        </aside>
        <div>
          <div className="catalog-toolbar">
            <label className="search-field"><Search size={18} /><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Cari nama produk atau SKU..." /></label>
            <select value={sort} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSort(event.target.value as SortMode)} aria-label="Urutkan produk"><option value="featured">Produk unggulan</option><option value="popular">Paling populer</option><option value="price-asc">Harga terendah</option><option value="price-desc">Harga tertinggi</option></select>
          </div>
          <div className="catalog-count"><strong>{filtered.length} produk</strong><span>siap dipilih</span></div>
          {filtered.length ? <div className="product-grid product-grid--catalog">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-card"><h2>Produk tidak ditemukan</h2><p>Coba gunakan kata kunci atau kategori lain.</p></div>}
        </div>
      </section>
    </>
  );
}
