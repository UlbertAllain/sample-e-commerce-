"use client";

import {
  Boxes,
  ChevronRight,
  CircleUserRound,
  FolderTree,
  Gauge,
  LogOut,
  Menu,
  PackageSearch,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/auth-provider";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/products", label: "Produk", icon: ShoppingBag },
  { href: "/admin/categories", label: "Kategori", icon: FolderTree },
  { href: "/admin/orders", label: "Pesanan", icon: PackageSearch },
  { href: "/admin/inventory", label: "Stok", icon: Boxes },
  { href: "/admin/customers", label: "Pelanggan", icon: Users },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function AdminShell({
  children,
  admin,
}: {
  children: React.ReactNode;
  admin: { name: string; email: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className={open ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="admin-sidebar__brand">
          <img src="/brand/logo-mark.svg" alt="" />
          <div>
            <strong>BERKAH OYOT</strong>
            <span>ADMIN Panel</span>
          </div>
          <button
            className="admin-sidebar__close"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={isActive(pathname, href) ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={15} />
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar__user">
          <CircleUserRound size={20} />
          <div>
            <strong>{admin.name}</strong>
            <span>{admin.email}</span>
          </div>
          <button onClick={handleLogout} title="Keluar">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {open && (
        <button
          className="admin-overlay"
          onClick={() => setOpen(false)}
          aria-label="Tutup menu"
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={21} />
          </button>
          <div>
            <strong>Panel Administrasi</strong>
            <span>Kelola storefront dan operasional toko</span>
          </div>
          <Link href="/" target="_blank" className="admin-store-link">
            Lihat toko
          </Link>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
