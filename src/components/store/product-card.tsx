"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Plus, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/context/store-provider";
import { getActiveVariants, getDisplayPrice, getDisplayStock } from "@/features/catalog/product-options";
import { formatCurrency } from "@/lib/formatters";
import type { Product } from "@/types/commerce";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const variants = getActiveVariants(product);
  const displayPrice = getDisplayPrice(product);
  const displayStock = getDisplayStock(product);

  function handleAdd() {
    if (variants.length) {
      router.push(`/products/${product.slug}`);
      return;
    }
    addToCart(product.id);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-card__media">
        <img src={product.image} alt={product.name} />
        <div className="product-card__badges">
          {product.isNew && <span>Baru</span>}
          {product.compareAtPrice && <span>Promo</span>}
          {variants.length > 0 && <span>{variants.length} VARIAN</span>}
        </div>
      </Link>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.categoryLabel}</span>
          <span><Star size={13} fill="currentColor" /> {product.rating}</span>
        </div>

        <Link href={`/products/${product.slug}`} className="product-card__title">
          {product.shortName}
        </Link>

        <p className="product-card__description">{product.description}</p>

        <div className="product-card__price-row">
          <div>
            <strong>{variants.length ? `Mulai ${formatCurrency(displayPrice)}` : formatCurrency(displayPrice)}</strong>
            {product.compareAtPrice && <del>{formatCurrency(product.compareAtPrice)}</del>}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            aria-label={variants.length ? "Pilih varian" : "Tambah ke keranjang"}
            disabled={displayStock <= 0}
          >
            {added ? <Check size={18} /> : variants.length ? <ArrowUpRight size={18} /> : <Plus size={18} />}
          </button>
        </div>

        <div className="product-card__foot">
          <span>{product.sold.toLocaleString("id-ID")} terjual</span>
          <span>Stok {displayStock}</span>
        </div>
      </div>
    </article>
  );
}
