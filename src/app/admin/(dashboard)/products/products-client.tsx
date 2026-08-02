"use client";

import { Archive, DatabaseZap, Edit3, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { formatCurrency } from "@/lib/formatters";
import type { Product } from "@/types/commerce";

export function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function reloadProducts() {
    setLoading(true);
    try {
      setProducts(await apiFetch<Product[]>("/api/admin/products"));
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Produk gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void apiFetch<Product[]>("/api/admin/products")
      .then((nextProducts) => {
        if (!cancelled) setProducts(nextProducts);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setMessage(caught instanceof Error ? caught.message : "Produk gagal dimuat.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => !normalized || `${product.name} ${product.sku} ${product.categoryLabel}`.toLowerCase().includes(normalized));
  }, [products, query]);

  async function archive(product: Product) {
    if (!window.confirm(`Arsipkan ${product.name}?`)) return;
    try {
      await apiFetch<{ archived: boolean }>(`/api/admin/products/${product.id}`, { method: "DELETE" });
      await reloadProducts();
    } catch (caught) { setMessage(caught instanceof ApiClientError ? caught.message : "Produk gagal diarsipkan."); }
  }

  async function bootstrap() {
    if (!window.confirm("Impor data statis awal ke Firestore? Proses hanya mengisi koleksi yang masih kosong.")) return;
    try {
      const result = await apiFetch<{ products: number; categories: number }>("/api/admin/bootstrap", { method: "POST" });
      setMessage(`${result.products} produk dan ${result.categories} kategori berhasil disinkronkan.`);
      await reloadProducts();
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Bootstrap gagal."); }
  }

  return (
    <>
      <div className="admin-page-heading"><div><span>KATALOG</span><h1>Manajemen produk</h1><p>Kelola harga, gambar Cloudinary, status, dan stok awal produk.</p></div><div className="admin-heading-actions"><button className="button button--secondary" onClick={bootstrap}><DatabaseZap size={17} /> Impor data awal</button><Link href="/admin/products/new" className="button button--primary"><Plus size={17} /> Tambah produk</Link></div></div>
      {message && <div className="admin-notice">{message}</div>}
      <section className="admin-panel">
        <div className="admin-toolbar"><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk, SKU, atau kategori" /></label><span>{filtered.length} produk</span></div>
        <div className="admin-table-wrap"><table className="admin-table admin-product-table"><thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
          {loading ? <tr><td colSpan={6}>Memuat produk...</td></tr> : filtered.length ? filtered.map((product) => <tr key={product.id}><td><div className="admin-product-cell"><img src={product.image} alt="" /><div><strong>{product.shortName}</strong><small>{product.sku}{product.variants?.length ? ` · ${product.variants.length} varian` : ""}</small></div></div></td><td>{product.categoryLabel}</td><td><strong>{product.variants?.length ? `Mulai ${formatCurrency(product.price)}` : formatCurrency(product.price)}</strong></td><td><span className={product.stock <= (product.minimumStock ?? 5) ? "admin-stock low" : "admin-stock"}>{product.stock}</span></td><td><span className={`admin-badge ${product.status}`}>{product.status}</span></td><td><div className="admin-row-actions"><Link href={`/admin/products/${product.id}`}><Edit3 size={16} /></Link><button onClick={() => archive(product)}><Archive size={16} /></button></div></td></tr>) : <tr><td colSpan={6}>Belum ada produk.</td></tr>}
        </tbody></table></div>
      </section>
    </>
  );
}
