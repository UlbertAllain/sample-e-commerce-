"use client";

import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { AdminDashboardSummary } from "@/types/commerce";

const cards = [
  { key: "revenue", label: "Pendapatan tercatat", icon: CircleDollarSign, format: formatCurrency },
  { key: "orders", label: "Total pesanan", icon: ShoppingBag },
  { key: "pendingOrders", label: "Perlu diproses", icon: PackageCheck },
  { key: "customers", label: "Pelanggan", icon: Users },
  { key: "activeProducts", label: "Produk aktif", icon: Boxes },
  { key: "lowStockProducts", label: "Stok menipis", icon: AlertTriangle },
] as const;

export function AdminDashboardClient() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<AdminDashboardSummary>("/api/admin/dashboard").then(setSummary).catch((caught) => setError(caught instanceof Error ? caught.message : "Dashboard gagal dimuat."));
  }, []);

  if (!summary && !error) return <div className="admin-loading">Memuat dashboard...</div>;
  if (!summary) return <div className="admin-error">{error}</div>;

  return (
    <>
      <div className="admin-page-heading">
        <div><span>RINGKASAN OPERASIONAL</span><h1>Dashboard</h1><p>Pantau transaksi, produk, stok, dan pelanggan dari satu halaman.</p></div>
        <Link href="/admin/products/new" className="button button--primary">Tambah produk</Link>
      </div>

      <section className="admin-stats-grid">
        {cards.map(({ key, label, icon: Icon, ...item }) => {
          const value = summary[key];
          return <article key={key} className="admin-stat-card"><div className="admin-stat-card__icon"><Icon size={20} /></div><span>{label}</span><strong>{"format" in item && item.format ? item.format(Number(value)) : Number(value).toLocaleString("id-ID")}</strong></article>;
        })}
      </section>

      <section className="admin-grid-two">
        <div className="admin-panel">
          <div className="admin-panel__heading"><div><span>PESANAN TERBARU</span><h2>Aktivitas transaksi</h2></div><Link href="/admin/orders">Lihat semua</Link></div>
          <div className="admin-table-wrap">
            <table className="admin-table"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Total</th><th>Status</th></tr></thead><tbody>
              {summary.recentOrders.length ? summary.recentOrders.map((order) => <tr key={order.id}><td><Link href={`/admin/orders/${order.orderNumber}`}><strong>{order.orderNumber}</strong><small>{formatDateTime(order.createdAt)}</small></Link></td><td>{order.customer.fullName}</td><td>{formatCurrency(order.grandTotal)}</td><td><span className={`admin-badge ${order.shipmentStatus}`}>{order.shipmentStatus.replaceAll("-", " ")}</span></td></tr>) : <tr><td colSpan={4}>Belum ada pesanan.</td></tr>}
            </tbody></table>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__heading"><div><span>PERFORMA PRODUK</span><h2>Produk terlaris</h2></div><Link href="/admin/products">Kelola produk</Link></div>
          <div className="admin-ranking">
            {summary.topProducts.length ? summary.topProducts.map((product, index) => <article key={product.id}><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{product.name}</strong><span>{product.sold.toLocaleString("id-ID")} terjual</span></div><em>Stok {product.stock}</em></article>) : <p>Belum ada data produk.</p>}
          </div>
        </div>
      </section>
    </>
  );
}
