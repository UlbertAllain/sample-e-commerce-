"use client";

import { Check, PackageSearch, Search } from "lucide-react";
import { FormEvent, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { demoOrder } from "@/data/demo-order";
import { getOrder } from "@/features/orders/order-storage";
import { formatDateTime } from "@/lib/formatters";
import type { Order } from "@/types/commerce";

export default function TrackingPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<Order | null>();
  function submit(event: FormEvent) { event.preventDefault(); const value = query.trim().toUpperCase(); const found = value === demoOrder.orderNumber || value === demoOrder.trackingNumber ? demoOrder : getOrder(value); setOrder(found); }
  return (
    <>
      <section className="page-hero page-hero--tracking"><div className="shell tracking-hero"><div><span className="eyebrow eyebrow--light">Tracking pengiriman</span><h1>Lacak perjalanan pesanan Anda.</h1><p>Masukkan nomor pesanan atau nomor resi yang diperoleh setelah checkout.</p></div><PackageSearch size={74} /></div></section>
      <section className="section shell tracking-section"><form className="tracking-search" onSubmit={submit}><Search size={20} /><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Contoh: RESI-DEMO-2026" required /><button className="button button--primary">Lacak</button></form><p className="tracking-hint">Untuk demonstrasi cepat gunakan <button onClick={() => setQuery("RESI-DEMO-2026")}>RESI-DEMO-2026</button>.</p>
      {order === null && <div className="empty-card"><h2>Nomor tidak ditemukan</h2><p>Periksa kembali nomor resi atau gunakan nomor demo yang tersedia.</p></div>}
      {order && <div className="tracking-result"><div className="tracking-summary"><div><span>Status saat ini</span><strong>{order.shipmentStatus.replaceAll("-", " ")}</strong></div><div><span>Kurir</span><strong>{order.shipping.courier} {order.shipping.service}</strong></div><div><span>Tujuan</span><strong>{order.customer.city}</strong></div><div><span>Nomor resi</span><strong>{order.trackingNumber}</strong></div></div><div className="timeline timeline--wide">{order.timeline.map((item) => <article key={item.status} className={item.completed ? "completed" : ""}><div className="timeline__dot">{item.completed && <Check size={13} />}</div><div><strong>{item.label}</strong><p>{item.description}</p>{item.timestamp && <time>{formatDateTime(item.timestamp)}</time>}</div></article>)}</div><Button href={`/orders/${order.orderNumber}`} variant="secondary">Lihat detail pesanan</Button></div>}</section>
    </>
  );
}
