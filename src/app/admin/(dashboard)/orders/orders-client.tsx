"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { Order, ShipmentStatus } from "@/types/commerce";

const statusOptions: Array<{ value: "all" | ShipmentStatus; label: string }> = [
  { value: "all", label: "Semua status" },
  { value: "waiting-payment", label: "Menunggu pembayaran" },
  { value: "processing", label: "Diproses" },
  { value: "packed", label: "Dikemas" },
  { value: "picked-up", label: "Diserahkan ke kurir" },
  { value: "in-transit", label: "Dalam perjalanan" },
  { value: "delivered", label: "Diterima" },
  { value: "cancelled", label: "Dibatalkan" },
];

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ShipmentStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Order[]>("/api/admin/orders").then(setOrders).catch((caught) => setError(caught instanceof Error ? caught.message : "Pesanan gagal dimuat.")).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return orders.filter((order) => status === "all" || order.shipmentStatus === status).filter((order) => !normalized || `${order.orderNumber} ${order.trackingNumber} ${order.customer.fullName} ${order.customer.email}`.toLowerCase().includes(normalized));
  }, [orders, query, status]);

  return (
    <>
      <div className="admin-page-heading"><div><span>ORDER MANAGEMENT</span><h1>Pesanan</h1><p>Verifikasi pembayaran, proses pengiriman, cetak dokumen, dan batalkan pesanan bila diperlukan.</p></div></div>
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-panel">
        <div className="admin-toolbar admin-toolbar--filters"><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nomor order, resi, atau pelanggan" /></label><select value={status} onChange={(event) => setStatus(event.target.value as "all" | ShipmentStatus)}>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><span>{filtered.length} pesanan</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Pembayaran</th><th>Pengiriman</th><th>Total</th><th></th></tr></thead><tbody>
          {loading ? <tr><td colSpan={6}>Memuat pesanan...</td></tr> : filtered.length ? filtered.map((order) => <tr key={order.id}><td><strong>{order.orderNumber}</strong><small>{formatDateTime(order.createdAt)}</small></td><td><strong>{order.customer.fullName}</strong><small>{order.customer.city}</small></td><td><span className={`admin-badge ${order.paymentStatus}`}>{order.paymentStatus}</span><small>{order.paymentMethod}</small></td><td><span className={`admin-badge ${order.shipmentStatus}`}>{order.shipmentStatus.replaceAll("-", " ")}</span><small>{order.shipping.courier} {order.shipping.service}</small></td><td><strong>{formatCurrency(order.grandTotal)}</strong></td><td><Link href={`/admin/orders/${order.orderNumber}`} className="admin-table-link">Detail</Link></td></tr>) : <tr><td colSpan={6}>Belum ada pesanan.</td></tr>}
        </tbody></table></div>
      </section>
    </>
  );
}
