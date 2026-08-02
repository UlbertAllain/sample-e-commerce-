"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useStore } from "@/context/store-provider";
import { formatCurrency } from "@/lib/formatters";

export default function CartPage() {
  const { displayLines, subtotal, updateQuantity, removeFromCart, hydrated } = useStore();
  const estimate = subtotal >= 300000 ? 0 : 18000;

  if (!hydrated) return <div className="shell loading-state">Memuat keranjang...</div>;
  if (!displayLines.length) return <section className="shell empty-state"><ShoppingBag size={48} /><span className="eyebrow">Keranjang kosong</span><h1>Belum ada produk yang dipilih.</h1><p>Tambahkan produk dari katalog untuk memulai simulasi checkout.</p><Button href="/catalog">Buka katalog</Button></section>;

  return (
    <section className="section shell">
      <div className="page-heading"><div><span className="eyebrow">Keranjang belanja</span><h1>Periksa produk sebelum checkout</h1></div><Link href="/catalog"><ArrowLeft size={16} /> Lanjut belanja</Link></div>
      <div className="cart-layout">
        <div className="cart-list">{displayLines.map((line) => <article className="cart-item" key={line.product.id}><img src={line.product.image} alt={line.product.name} /><div className="cart-item__content"><span className="eyebrow">{line.product.categoryLabel}</span><Link href={`/products/${line.product.slug}`}>{line.product.shortName}</Link><small>{line.product.sku}</small><div className="cart-item__controls"><QuantityStepper value={line.quantity} max={line.product.stock} onChange={(value) => updateQuantity(line.product.id, value)} /><button onClick={() => removeFromCart(line.product.id)}><Trash2 size={16} /> Hapus</button></div></div><div className="cart-item__price"><strong>{formatCurrency(line.subtotal)}</strong><span>{formatCurrency(line.unitPrice)} / pcs</span></div></article>)}</div>
        <aside className="summary-card"><h2>Ringkasan belanja</h2><div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><div><span>Estimasi ongkir</span><strong>{estimate === 0 ? "Gratis" : formatCurrency(estimate)}</strong></div><div className="summary-card__total"><span>Estimasi total</span><strong>{formatCurrency(subtotal + estimate)}</strong></div><p>Ongkir final dipilih pada tahap checkout.</p><Button href="/checkout" className="full-width">Lanjut checkout</Button><small>Data alamat akan diambil otomatis dari akun pelanggan.</small></aside>
      </div>
    </section>
  );
}
