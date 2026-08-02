import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";
import { products } from "@/data/products";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Produk terpilih",
    text: "Perlengkapan akuarium dengan informasi produk yang jelas.",
  },
  {
    icon: Truck,
    title: "Pengiriman fleksibel",
    text: "Pilih layanan pengiriman sesuai kebutuhan.",
  },
  {
    icon: CreditCard,
    title: "Pembayaran mudah",
    text: "Transfer bank, QRIS, dan COD.",
  },
  {
    icon: PackageCheck,
    title: "Lacak pesanan",
    text: "Pantau status pengiriman dari satu halaman.",
  },
];

export default function HomePage() {
  const featured = products.filter((product) => product.isFeatured).slice(0, 8);

  return (
    <>
      <section className="commerce-hero">
        <div className="shell commerce-hero__grid">
          <div className="commerce-hero__copy">
            <span className="section-kicker">PREMIUM AQUARIUM STORE</span>
            <h1>Semua kebutuhan akuarium dalam satu tempat.</h1>
            <p>
              Temukan filter, pompa, lampu, dekorasi, pakan, dan perlengkapan perawatan akuarium.
            </p>
            <div className="commerce-hero__actions">
              <Button href="/catalog">Belanja sekarang <ArrowRight size={18} /></Button>
              <Link href="/tracking" className="secondary-cta">
                Lacak pesanan
              </Link>
            </div>
          </div>

          <div className="commerce-hero__visual">
            <img
              src="/brand/stage-storefront.svg"
              alt="Tampilan katalog Berkah Oyot"
            />
          </div>
        </div>
      </section>

      <section className="section section--compact shell">
        <div className="category-strip">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog?category=${category.id}`}
              className="category-strip__item"
            >
              <span>{category.icon}</span>
              <strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--compact product-zone-v3">
        <div className="shell">
          <div className="section-heading section-heading--clean">
            <div>
              <span className="section-kicker">PRODUK POPULER</span>
              <h2>Produk pilihan</h2>
            </div>
            <Link href="/catalog" className="inline-link">
              Lihat semua <ArrowRight size={16} />
            </Link>
          </div>

          <div className="product-grid product-grid--feature-v3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--compact shell">
        <div className="benefit-grid">
          {benefits.map(({ icon: Icon, title, text }) => (
            <article key={title} className="benefit-card">
              <div className="benefit-card__icon">
                <Icon size={20} />
              </div>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--compact shell">
        <div className="promo-simple">
          <div>
            <span>Diskon 10%</span>
            <h2>Gunakan kode AQUA10</h2>
            <p>Maksimal potongan Rp25.000.</p>
          </div>
          <Button href="/catalog" variant="secondary">
            Belanja sekarang
          </Button>
        </div>
      </section>
    </>
  );
}
