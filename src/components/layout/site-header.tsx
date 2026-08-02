"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useStore } from "@/context/store-provider";

const nav = [
  { href: "/", label: "Beranda" },
  { href: "/catalog", label: "Katalog" },
  { href: "/tracking", label: "Lacak Pesanan" },
];

const categoryNav = [
  { href: "/catalog?category=filter", label: "Filtrasi" },
  { href: "/catalog?category=machine", label: "Mesin & Pompa" },
  { href: "/catalog?category=lighting", label: "Lampu" },
  { href: "/catalog?category=decoration", label: "Dekorasi" },
  { href: "/catalog?category=food-medicine", label: "Pakan & Obat" },
];

export function SiteHeader() {
  const { itemCount } = useStore();
  const { user, hydrated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="utility-bar no-print">
        <div className="shell utility-bar__inner">
          <span>Pengiriman dari Sukoharjo</span>
          <span>Senin–Sabtu</span>
        </div>
      </div>

      <header className="site-header no-print">
        <div className="shell site-header__inner">
          <Link href="/" className="brand" aria-label="Berkah Oyot">
            <img src="/brand/logo-mark.svg" alt="" />
            <div>
              <strong>BERKAH OYOT</strong>
              <span>Premium Aquarium Store</span>
            </div>
          </Link>

          <nav className="desktop-nav">
            {nav.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link href="/catalog" className="header-search-chip" aria-label="Cari produk">
              <Search size={16} />
              <span>Cari produk</span>
            </Link>

            <Link href={user ? "/account" : "/login"} className="account-link" aria-label="Akun pelanggan">
              <UserRound size={18} />
              <span>{hydrated && user ? user.profile.fullName.split(" ")[0] : "Masuk"}</span>
            </Link>

            <Link href="/cart" className="header-action cart-link" aria-label="Keranjang">
              <ShoppingBag size={19} />
              <span>{itemCount}</span>
            </Link>

            <button className="mobile-menu-button" onClick={() => setOpen((value) => !value)} aria-label="Menu">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <div className="category-nav-wrap">
          <nav className="shell category-nav">
            {categoryNav.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/catalog" className="category-nav__all">
              Semua produk
            </Link>
          </nav>
        </div>

        {open && (
          <nav className="mobile-nav shell">
            {nav.map((item) => (
              <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href={user ? "/account" : "/login"} onClick={() => setOpen(false)}>
              {user ? "Akun saya" : "Masuk / Daftar"}
            </Link>
            <Link href="/cart" onClick={() => setOpen(false)}>
              Keranjang ({itemCount})
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
