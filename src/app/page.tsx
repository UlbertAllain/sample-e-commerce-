"use client";

import Link from "next/link";
import { ArrowRight, Leaf, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/context/catalog-provider";
import { formatCurrency } from "@/lib/formatters";

const services = [
  {
    icon: ShieldCheck,
    title: "Produk terkurasi",
    text: "Informasi produk, stok, dan spesifikasi ditampilkan dengan jelas.",
  },
  {
    icon: Truck,
    title: "Pengiriman fleksibel",
    text: "Pilih layanan reguler, cepat, atau ambil langsung di toko.",
  },
  {
    icon: PackageCheck,
    title: "Pesanan mudah dilacak",
    text: "Nomor resi dan perjalanan paket tersedia setelah checkout.",
  },
];

export default function HomePage() {
  const { products, categories, loading } = useCatalog();
  const featured = products.filter((product) => product.isFeatured).slice(0, 6);
  const highlights = products.slice(0, 3);
  const heroProduct = products.find((product) => product.category === "decoration") ?? products[0];

  if (loading && !products.length) {
    return <div className="shell loading-state">Memuat katalog...</div>;
  }

  if (!heroProduct) {
    return <section className="shell empty-state"><h1>Produk belum tersedia</h1><p>Tambahkan produk melalui dashboard admin.</p><Button href="/admin/products/new">Tambah produk</Button></section>;
  }

  const galleryPrimary = products[4] ?? products[1] ?? heroProduct;
  const gallerySecondary = products[7] ?? products[2] ?? heroProduct;

  return (
    <>
      <section className="natural-home">
        <div className="shell natural-home__grid">
          <div className="natural-home__main">
            <div className="natural-home__copy">
              <span className="eyebrow">BERKAH OYOT AQUARIUM STORE</span>
              <h1>Harmoni alam di dalam kaca.</h1>
              <p>
                Temukan perlengkapan filtrasi, sirkulasi, pencahayaan, dekorasi,
                dan perawatan untuk membangun akuarium yang lebih sehat dan indah.
              </p>
              <div className="natural-home__actions">
                <Button href="/catalog">Mulai belanja <ArrowRight size={18} /></Button>
                <Link href="/tracking" className="text-link">Lacak pesanan <ArrowRight size={16} /></Link>
              </div>
            </div>

            <div className="natural-home__visual">
              <img src="/brand/hero-aquarium.svg" alt="Aquascape Berkah Oyot" />
            </div>


            <article className="natural-home__floating-product">
              <div className="natural-home__floating-image">
                <img src={heroProduct.image} alt={heroProduct.name} />
              </div>
              <div>
                <span>{heroProduct.categoryLabel}</span>
                <Link href={`/products/${heroProduct.slug}`}>{heroProduct.shortName}</Link>
                <strong>{formatCurrency(heroProduct.price)}</strong>
              </div>
            </article>
          </div>

          <aside className="natural-home__aside">
            <div className="natural-home__aside-heading">
              <div>
                <span className="eyebrow">PILIHAN TOKO</span>
                <h2>Produk unggulan</h2>
              </div>
              <Link href="/catalog">Lihat semua <ArrowRight size={15} /></Link>
            </div>

            <div className="natural-home__highlight-list">
              {highlights.map((product, index) => (
                <article key={product.id} className="highlight-product">
                  <Link href={`/products/${product.slug}`} className="highlight-product__media">
                    <img src={product.image} alt={product.name} />
                    <span>{index === 0 ? "Terlaris" : index === 1 ? "Pilihan" : "Favorit"}</span>
                  </Link>
                  <div className="highlight-product__body">
                    <Link href={`/products/${product.slug}`}>{product.shortName}</Link>
                    <p>{product.description}</p>
                    <strong>{formatCurrency(product.price)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="section section--compact shell">
        <div className="natural-category-list">
          {categories.map((category) => (
            <Link key={category.id} href={`/catalog?category=${category.id}`}>
              <span>{category.icon}</span>
              <div>
                <strong>{category.name}</strong>
                <small>{category.description}</small>
              </div>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--compact shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">KOLEKSI PILIHAN</span>
            <h2>Perlengkapan untuk kebutuhan harian</h2>
          </div>
          <Link href="/catalog" className="text-link">Semua produk <ArrowRight size={16} /></Link>
        </div>
        <div className="product-grid product-grid--feature">
          {featured.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="section section--compact shell natural-inspiration">
        <div className="natural-inspiration__content">
          <span className="eyebrow">INSPIRASI AQUARIUM</span>
          <h2>Bangun ekosistem yang nyaman untuk ikan dan enak dipandang.</h2>
          <p>
            Kombinasikan filtrasi yang tepat, sirkulasi stabil, pencahayaan, dan elemen dekorasi
            sesuai ukuran akuarium Anda.
          </p>
          <div className="natural-inspiration__services">
            {services.map(({ icon: Icon, title, text }) => (
              <article key={title}>
                <Icon size={20} />
                <div><strong>{title}</strong><p>{text}</p></div>
              </article>
            ))}
          </div>
        </div>
        <div className="natural-inspiration__gallery">
          <img src="/brand/hero-aquarium.svg" alt="Inspirasi aquascape" />
          <div>
            <img src={galleryPrimary.image} alt={galleryPrimary.name} />
            <img src={gallerySecondary.image} alt={gallerySecondary.name} />
          </div>
          <span><Leaf size={17} /> Pilihan untuk aquascape natural</span>
        </div>
      </section>

      <section className="section section--compact shell">
        <div className="natural-promo">
          <div>
            <span>Potongan 10%</span>
            <h2>Gunakan kode AQUA10</h2>
            <p>Maksimal potongan Rp25.000 untuk pesanan Anda.</p>
          </div>
          <Button href="/catalog" variant="secondary">Belanja sekarang</Button>
        </div>
      </section>
    </>
  );
}
