"use client";

import Link from "next/link";
import { Check, ChevronRight, PackageCheck, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { ProductCard } from "@/components/store/product-card";
import { useStore } from "@/context/store-provider";
import { products } from "@/data/products";
import { formatCurrency, formatWeight } from "@/lib/formatters";
import type { Product } from "@/types/commerce";

export function ProductDetailClient({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState(product.gallery[0]);
  const [added, setAdded] = useState(false);
  const unitPrice = product.wholesalePrice && product.wholesaleMinimum && quantity >= product.wholesaleMinimum ? product.wholesalePrice : product.price;
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);

  function add(goToCart = false) {
    addToCart(product.id, quantity);
    setAdded(true);
    if (goToCart) router.push("/cart");
    else window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <>
      <div className="shell breadcrumbs"><Link href="/">Beranda</Link><ChevronRight size={14} /><Link href="/catalog">Katalog</Link><ChevronRight size={14} /><span>{product.shortName}</span></div>
      <section className="section shell product-detail">
        <div className="product-gallery">
          <div className="product-gallery__main"><img src={image} alt={product.name} /></div>
          <div className="product-gallery__thumbs">{product.gallery.map((item) => <button key={item} className={image === item ? "active" : ""} onClick={() => setImage(item)}><img src={item} alt="" /></button>)}</div>
        </div>
        <div className="product-info">
          <span className="eyebrow">{product.categoryLabel}</span>
          <h1>{product.name}</h1>
          <div className="product-meta"><span><Star size={16} fill="currentColor" /> {product.rating}</span><span>{product.sold.toLocaleString("id-ID")} terjual</span><span>SKU {product.sku}</span></div>
          <p className="product-description">{product.description}</p>
          <div className="detail-price"><strong>{formatCurrency(unitPrice)}</strong>{product.compareAtPrice && <del>{formatCurrency(product.compareAtPrice)}</del>}</div>
          {product.wholesalePrice && product.wholesaleMinimum && <div className="wholesale-box"><strong>Harga grosir aktif otomatis</strong><p>Beli minimal {product.wholesaleMinimum} pcs untuk harga {formatCurrency(product.wholesalePrice)} / pcs.</p></div>}
          <div className="stock-line"><span><Check size={16} /> Stok tersedia</span><strong>{product.stock} pcs</strong></div>
          <div className="purchase-row"><QuantityStepper value={quantity} max={product.stock} onChange={setQuantity} /><button className="button button--primary grow" onClick={() => add(false)}><ShoppingBag size={18} /> Tambah keranjang</button></div>
          <button className="button button--secondary full-width" onClick={() => add(true)}>Beli sekarang · {formatCurrency(unitPrice * quantity)}</button>
          {added && <div className="success-inline"><Check size={17} /> Produk berhasil ditambahkan.</div>}
          <div className="service-points"><div><Truck size={20} /><span><strong>Pengiriman fleksibel</strong>JNE, J&T, SiCepat, atau ambil di toko.</span></div><div><ShieldCheck size={20} /><span><strong>Pembayaran aman</strong>Transfer bank, QRIS, dan COD.</span></div><div><PackageCheck size={20} /><span><strong>Packaging terkontrol</strong>Pemeriksaan barang sebelum dikirim.</span></div></div>
        </div>
      </section>
      <section className="section section--soft"><div className="shell product-specs"><div><span className="eyebrow">Detail produk</span><h2>Spesifikasi dan informasi</h2><p>Berat pengiriman: {formatWeight(product.weightGrams)}. Periksa spesifikasi sebelum memilih jumlah dan layanan pengiriman.</p></div><dl>{product.specs.map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></div></section>
      {related.length > 0 && <section className="section shell"><div className="section-heading"><div><span className="eyebrow">Produk terkait</span><h2>Masih dalam kategori {product.categoryLabel}</h2></div></div><div className="product-grid product-grid--three">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    </>
  );
}
