"use client";

import { ArrowDownToLine, ArrowUpFromLine, RotateCcw, Save } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { formatDateTime } from "@/lib/formatters";
import type { InventoryMovement, InventoryMovementType, Product, ProductVariant } from "@/types/commerce";

type AdjustmentType = "adjustment-in" | "adjustment-out" | "return";

type InventorySnapshot = {
  products: Product[];
  movements: InventoryMovement[];
};

type StockItem = {
  key: string;
  product: Product;
  variant?: ProductVariant;
};

const movementLabels: Record<InventoryMovementType, string> = {
  sale: "Penjualan",
  "adjustment-in": "Stok masuk",
  "adjustment-out": "Stok keluar",
  return: "Retur",
  cancellation: "Pembatalan",
};

async function fetchInventorySnapshot(): Promise<InventorySnapshot> {
  const [products, movements] = await Promise.all([
    apiFetch<Product[]>("/api/admin/products"),
    apiFetch<InventoryMovement[]>("/api/admin/inventory/adjustments"),
  ]);
  return { products, movements };
}

export function AdminInventoryClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [type, setType] = useState<AdjustmentType>("adjustment-in");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function applySnapshot(snapshot: InventorySnapshot) {
    setProducts(snapshot.products);
    setMovements(snapshot.movements);
    setProductId((current) => current || snapshot.products[0]?.id || "");
    setVariantId((current) => current || snapshot.products[0]?.variants?.find((variant) => variant.isActive !== false)?.id || "");
  }

  async function reloadInventory() {
    try {
      applySnapshot(await fetchInventorySnapshot());
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Inventori gagal dimuat.");
    }
  }

  useEffect(() => {
    let cancelled = false;

    void fetchInventorySnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        setProducts(snapshot.products);
        setMovements(snapshot.movements);
        setProductId((current) => current || snapshot.products[0]?.id || "");
        setVariantId((current) => current || snapshot.products[0]?.variants?.find((variant) => variant.isActive !== false)?.id || "");
      })
      .catch((caught: unknown) => {
        if (!cancelled) setMessage(caught instanceof Error ? caught.message : "Inventori gagal dimuat.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await apiFetch<InventoryMovement>("/api/admin/inventory/adjustments", {
        method: "POST",
        body: JSON.stringify({ productId, variantId: variantId || undefined, type, quantity, reason }),
      });
      setQuantity("1");
      setReason("");
      setMessage("Stok berhasil disesuaikan.");
      await reloadInventory();
    } catch (caught) {
      setMessage(caught instanceof ApiClientError ? caught.message : "Penyesuaian stok gagal.");
    } finally {
      setSaving(false);
    }
  }

  const selected = products.find((product) => product.id === productId);
  const selectedVariants = (selected?.variants ?? []).filter((variant) => variant.isActive !== false);
  const selectedVariant = selectedVariants.find((variant) => variant.id === variantId) ?? selectedVariants[0];
  const stockItems = useMemo<StockItem[]>(() => products.flatMap<StockItem>((product) => {
    const variants = (product.variants ?? []).filter((variant) => variant.isActive !== false);
    if (!variants.length) return [{ key: product.id, product, variant: undefined }];
    return variants.map((variant) => ({ key: `${product.id}-${variant.id}`, product, variant }));
  }).sort((a, b) => (a.variant?.stock ?? a.product.stock) - (b.variant?.stock ?? b.product.stock)), [products]);

  function chooseProduct(nextProductId: string) {
    const product = products.find((item) => item.id === nextProductId);
    setProductId(nextProductId);
    setVariantId((product?.variants ?? []).find((variant) => variant.isActive !== false)?.id ?? "");
  }

  return (
    <>
      <div className="admin-page-heading"><div><span>INVENTORY CONTROL</span><h1>Stok dan mutasi</h1><p>Penjualan mengurangi stok secara atomik. Penyesuaian manual tercatat sebagai mutasi.</p></div></div>
      {message && <div className="admin-notice">{message}</div>}
      <section className="admin-grid-two admin-grid-two--inventory">
        <form className="admin-panel admin-form" onSubmit={submit}>
          <div className="admin-panel__heading"><div><span>PENYESUAIAN STOK</span><h2>Catat mutasi manual</h2></div></div>
          <label>Produk<select value={productId} onChange={(event) => chooseProduct(event.target.value)} required>{products.map((product) => <option key={product.id} value={product.id}>{product.shortName} · {product.sku}</option>)}</select></label>
          {selectedVariants.length > 0 && <label>Varian<select value={selectedVariant?.id ?? ""} onChange={(event) => setVariantId(event.target.value)} required>{selectedVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name} · {variant.sku}</option>)}</select></label>}
          {selected && <div className="admin-selected-stock"><img src={selected.image} alt="" /><div><strong>{selected.shortName}{selectedVariant ? ` · ${selectedVariant.name}` : ""}</strong><span>Stok saat ini</span></div><b>{selectedVariant?.stock ?? selected.stock}</b></div>}
          <div className="admin-adjustment-types">
            <button type="button" className={type === "adjustment-in" ? "active" : ""} onClick={() => setType("adjustment-in")}><ArrowDownToLine size={18} /> Stok masuk</button>
            <button type="button" className={type === "adjustment-out" ? "active" : ""} onClick={() => setType("adjustment-out")}><ArrowUpFromLine size={18} /> Stok keluar</button>
            <button type="button" className={type === "return" ? "active" : ""} onClick={() => setType("return")}><RotateCcw size={18} /> Retur</button>
          </div>
          <label>Jumlah<input type="text" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value.replace(/\D+/g, ""))} required /></label>
          <label>Alasan<textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Contoh: restock dari supplier" required /></label>
          <button className="button button--primary" disabled={saving || !productId}><Save size={17} /> {saving ? "Mencatat..." : "Simpan mutasi"}</button>
        </form>

        <div className="admin-panel">
          <div className="admin-panel__heading"><div><span>RINGKASAN STOK</span><h2>Produk perlu perhatian</h2></div></div>
          <div className="admin-stock-list">
            {stockItems.slice(0, 12).map(({ key, product, variant }) => {
              const stock = variant?.stock ?? product.stock;
              const minimum = variant?.minimumStock ?? product.minimumStock ?? 5;
              return <article key={key}><img src={product.image} alt="" /><div><strong>{product.shortName}{variant ? ` · ${variant.name}` : ""}</strong><span>{variant?.sku ?? product.sku} · batas minimum {minimum}</span></div><b className={stock <= minimum ? "low" : ""}>{stock}</b></article>;
            })}
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__heading"><div><span>AUDIT INVENTORI</span><h2>Riwayat mutasi</h2></div><span>{movements.length} catatan terbaru</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Waktu</th><th>Produk</th><th>Jenis</th><th>Perubahan</th><th>Stok</th><th>Alasan</th></tr></thead><tbody>
          {movements.length ? movements.map((movement) => <tr key={movement.id}><td>{formatDateTime(movement.createdAt)}</td><td><strong>{movement.productName}{movement.variantName ? ` · ${movement.variantName}` : ""}</strong><small>{movement.sku}</small></td><td><span className={`admin-badge ${movement.type}`}>{movementLabels[movement.type]}</span></td><td><strong className={movement.quantity >= 0 ? "admin-positive" : "admin-negative"}>{movement.quantity >= 0 ? "+" : ""}{movement.quantity}</strong></td><td>{movement.stockBefore} → {movement.stockAfter}</td><td>{movement.reason}</td></tr>) : <tr><td colSpan={6}>Belum ada mutasi stok.</td></tr>}
        </tbody></table></div>
      </section>
    </>
  );
}
