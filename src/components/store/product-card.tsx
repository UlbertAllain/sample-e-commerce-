"use client";

import Link from "next/link";
import { Check, Plus, Star } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/context/store-provider";
import { formatCurrency } from "@/lib/formatters";
import type { Product } from "@/types/commerce";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const [added, setAdded] = useState(false);

  function handleAdd() {
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
            <strong>{formatCurrency(product.price)}</strong>
            {product.compareAtPrice && <del>{formatCurrency(product.compareAtPrice)}</del>}
          </div>
          <button type="button" onClick={handleAdd} aria-label="Tambah ke keranjang">
            {added ? <Check size={18} /> : <Plus size={18} />}
          </button>
        </div>

        <div className="product-card__foot">
          <span>{product.sold.toLocaleString("id-ID")} terjual</span>
          <span>Stok {product.stock}</span>
        </div>
      </div>
    </article>
  );
}
