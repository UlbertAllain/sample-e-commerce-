"use client";

import Link from "next/link";
import { Check, ChevronRight, PackageCheck, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { ProductCard } from "@/components/store/product-card";
import { useCatalog } from "@/context/catalog-provider";
import { useStore } from "@/context/store-provider";
import { getActiveVariants, getSellablePrice, getSellableStock } from "@/features/catalog/product-options";
import { formatCurrency, formatWeight } from "@/lib/formatters";
import type { Product } from "@/types/commerce";

export function ProductDetailClient({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const { products } = useCatalog();
  const router = useRouter();
  const variants = useMemo(() => getActiveVariants(product), [product]);
  const [selectedVariantId, setSelectedVariantId] = useState(variants.find((variant) => variant.stock > 0)?.id ?? variants[0]?.id ?? "");
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const stock = getSellableStock(product, selectedVariant);
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState(product.gallery[0] ?? product.image);
  const [added, setAdded] = useState(false);
  const unitPrice = getSellablePrice(product, quantity, selectedVariant);
  const compareAtPrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const wholesalePrice = selectedVariant?.wholesalePrice ?? product.wholesalePrice;
  const wholesaleMinimum = selectedVariant?.wholesaleMinimum ?? product.wholesaleMinimum;
  const sku = selectedVariant?.sku ?? product.sku;
  const weight = selectedVariant?.weightGrams ?? product.weightGrams;
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);

  function chooseVariant(variantId: string) {
    const variant = variants.find((item) => item.id === variantId);
    setSelectedVariantId(variantId);
    setQuantity((current) => Math.min(Math.max(1, current), variant?.stock ?? 1));
  }

  function add(goToCart = false) {
    if (stock <= 0) return;
    addToCart(product.id, quantity, selectedVariant?.id);
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
          <div className="product-meta"><span><Star size={16} fill="currentColor" /> {product.rating}</span><span>{product.sold.toLocaleString("id-ID")} terjual</span><span>SKU {sku}</span></div>
          <p className="product-description">{product.description}</p>

          {variants.length > 0 && (
            <div className="product-variant-picker">
              <div className="product-variant-picker__heading"><strong>Pilih varian</strong><span>{selectedVariant?.name}</span></div>
              <div className="product-variant-picker__options">
                {variants.map((variant) => (
                  <button type="button" key={variant.id} className={variant.id === selectedVariantId ? "active" : ""} onClick={() => chooseVariant(variant.id)} disabled={variant.stock <= 0}>
                    <strong>{variant.name}</strong>
                    <span>{formatCurrency(variant.price)} · stok {variant.stock}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="detail-price"><strong>{formatCurrency(unitPrice)}</strong>{compareAtPrice && <del>{formatCurrency(compareAtPrice)}</del>}</div>
          {wholesalePrice && wholesaleMinimum && <div className="wholesale-box"><strong>Harga grosir aktif otomatis</strong><p>Beli minimal {wholesaleMinimum} pcs untuk harga {formatCurrency(wholesalePrice)} / pcs.</p></div>}
          <div className="stock-line"><span><Check size={16} /> {stock > 0 ? "Stok tersedia" : "Stok habis"}</span><strong>{stock} pcs</strong></div>
          <div className="purchase-row"><QuantityStepper value={quantity} max={Math.max(1, stock)} onChange={setQuantity} /><button className="button button--primary grow" onClick={() => add(false)} disabled={stock <= 0}><ShoppingBag size={18} /> Tambah keranjang</button></div>
          <button className="button button--secondary full-width" onClick={() => add(true)} disabled={stock <= 0}>Beli sekarang · {formatCurrency(unitPrice * quantity)}</button>
          {added && <div className="success-inline"><Check size={17} /> Produk berhasil ditambahkan.</div>}
          <div className="service-points"><div><Truck size={20} /><span><strong>Pengiriman fleksibel</strong>JNE, J&T, SiCepat, atau ambil di toko.</span></div><div><ShieldCheck size={20} /><span><strong>Pembayaran aman</strong>Transfer, QRIS, dan COD.</span></div><div><PackageCheck size={20} /><span><strong>Resi dan tracking</strong>Label pengiriman tersedia setelah pesanan dibuat.</span></div></div>
        </div>
      </section>

      <section className="section section--soft"><div className="shell product-specs"><div><span className="eyebrow">Spesifikasi</span><h2>Informasi produk</h2><p>Berat pengiriman varian terpilih: {formatWeight(weight)}.</p></div><dl>{product.specs.map((spec) => <div key={`${spec.label}-${spec.value}`}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></div></section>
      {related.length > 0 && <section className="section shell"><div className="section-heading"><div><span className="eyebrow">Produk terkait</span><h2>Lengkapi kebutuhan Anda</h2></div><Link href={`/catalog?category=${product.category}`}>Lihat kategori <ChevronRight size={16} /></Link></div><div className="product-grid product-grid--catalog">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    </>
  );
}
