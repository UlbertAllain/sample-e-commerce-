"use client";

import { Check, PackageSearch, Search } from "lucide-react";
import { FormEvent, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { formatDateTime } from "@/lib/formatters";
import type { Order } from "@/types/commerce";

export default function TrackingPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<Order | null>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await apiFetch<Order>(`/api/store/orders/${encodeURIComponent(value)}`);
      setOrder(result);
    } catch (caught) {
      setOrder(null);
      setMessage(caught instanceof ApiClientError ? caught.message : "Pesanan tidak dapat dilacak.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="page-hero page-hero--tracking">
        <div className="shell tracking-hero">
          <div><span className="eyebrow eyebrow--light">Tracking pengiriman</span><h1>Lacak perjalanan pesanan Anda.</h1><p>Masuk ke akun, lalu masukkan nomor pesanan atau nomor resi.</p></div>
          <PackageSearch size={74} />
        </div>
      </section>
      <section className="section shell tracking-section">
        <form className="tracking-search" onSubmit={submit}>
          <Search size={20} />
          <input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Nomor pesanan atau nomor resi" required />
          <button className="button button--primary" disabled={loading}>{loading ? "Mencari..." : "Lacak"}</button>
        </form>
        {order === null && <div className="empty-card"><h2>Pesanan tidak ditemukan</h2><p>{message || "Periksa nomor dan pastikan Anda masuk menggunakan akun pemilik pesanan."}</p><Button href="/login?next=/tracking" variant="secondary">Masuk ke akun</Button></div>}
        {order && <div className="tracking-result"><div className="tracking-summary"><div><span>Status saat ini</span><strong>{order.shipmentStatus.replaceAll("-", " ")}</strong></div><div><span>Kurir</span><strong>{order.shipping.courier} {order.shipping.service}</strong></div><div><span>Tujuan</span><strong>{order.customer.city}</strong></div><div><span>Nomor resi</span><strong>{order.trackingNumber}</strong></div></div><div className="timeline timeline--wide">{order.timeline.map((item) => <article key={item.status} className={item.completed ? "completed" : ""}><div className="timeline__dot">{item.completed && <Check size={13} />}</div><div><strong>{item.label}</strong><p>{item.description}</p>{item.timestamp && <time>{formatDateTime(item.timestamp)}</time>}</div></article>)}</div><Button href={`/orders/${order.orderNumber}`} variant="secondary">Lihat detail pesanan</Button></div>}
      </section>
    </>
  );
}
