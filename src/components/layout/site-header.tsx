"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useStore } from "@/context/store-provider";

const shopNav = [
  { href: "/catalog?category=filter", label: "Filtrasi" },
  { href: "/catalog?category=machine", label: "Mesin & Pompa" },
  { href: "/catalog?category=lighting", label: "Pencahayaan" },
  { href: "/catalog?category=decoration", label: "Dekorasi" },
  { href: "/catalog?category=food-medicine", label: "Perawatan" },
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
          <div>
            <Link href="/tracking">Lacak pesanan</Link>
            <span>Senin–Sabtu</span>
          </div>
        </div>
      </div>

      <header className="site-header no-print">
        <div className="shell site-header__inner">
          <Link href="/" className="brand" aria-label="Berkah Oyot">
            <img src="/brand/logo-mark.svg" alt="" />
            <div>
              <strong>Berkah Oyot</strong>
              <span>Aquarium Store</span>
            </div>
          </Link>

          <nav className="desktop-nav" aria-label="Kategori produk">
            {shopNav.map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
            <Link href="/catalog">Semua Produk</Link>
          </nav>

          <div className="header-actions">
            <Link href="/catalog" className="header-action" aria-label="Cari produk">
              <Search size={19} />
            </Link>
            <Link href={user ? "/account" : "/login"} className="header-action account-link" aria-label="Akun pelanggan">
              <UserRound size={19} />
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

        {open && (
          <nav className="mobile-nav shell">
            <Link href="/" onClick={() => setOpen(false)}>Beranda</Link>
            {shopNav.map((item) => (
              <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
            <Link href="/catalog" onClick={() => setOpen(false)}>Semua produk</Link>
            <Link href="/tracking" onClick={() => setOpen(false)}>Lacak pesanan</Link>
            <Link href={user ? "/account" : "/login"} onClick={() => setOpen(false)}>
              {user ? "Akun saya" : "Masuk / Daftar"}
            </Link>
            <Link href="/cart" onClick={() => setOpen(false)}>Keranjang ({itemCount})</Link>
          </nav>
        )}
      </header>
    </>
  );
}
