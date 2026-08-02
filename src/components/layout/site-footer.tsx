import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer no-print">
      <div className="shell footer-grid">
        <div className="footer-about">
          <Link href="/" className="brand brand--footer">
            <img src="/brand/logo-mark.svg" alt="" />
            <div>
              <strong>BERKAH OYOT</strong>
              <span>Premium Aquarium Store</span>
            </div>
          </Link>
          <p>
            Perlengkapan filtrasi, mesin, pencahayaan, dekorasi, pakan, dan perawatan akuarium.
          </p>
        </div>

        <div>
          <h4>Belanja</h4>
          <Link href="/catalog">Semua produk</Link>
          <Link href="/catalog?category=filter">Filtrasi</Link>
          <Link href="/catalog?category=machine">Mesin & pompa</Link>
          <Link href="/cart">Keranjang</Link>
        </div>

        <div>
          <h4>Layanan</h4>
          <Link href="/tracking">Lacak pesanan</Link>
          <Link href="/account">Akun pelanggan</Link>
          <Link href="/login">Masuk</Link>
          <Link href="/register">Daftar</Link>
        </div>

        <div>
          <h4>Kontak</h4>
          <p>Blimbing, Wonorejo, Polokarto, Sukoharjo, Jawa Tengah 57555</p>
          <p>+62 882-0053-95987</p>
          <p>admin@berkahoyot.com</p>
        </div>
      </div>

      <div className="shell footer-bottom">
        <span>© 2026 Berkah Oyot</span>
        <span>Aquarium Store · Sukoharjo</span>
      </div>
    </footer>
  );
}
