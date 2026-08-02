"use client";

import { Check, Clipboard, Clock3, CreditCard, QrCode, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getOrder, markOrderPaid } from "@/features/orders/order-storage";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { Order } from "@/types/commerce";

export function PaymentClient({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>();
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => setOrder(getOrder(orderNumber)), [orderNumber]);
  if (order === undefined) return <div className="shell loading-state">Memuat pembayaran...</div>;
  if (!order) return <section className="shell empty-state"><h1>Pesanan tidak ditemukan</h1><p>Data transaksi tidak tersedia pada browser ini.</p><Button href="/catalog">Kembali ke katalog</Button></section>;

  function completePayment() {
    setProcessing(true);
    window.setTimeout(() => {
      const updated = markOrderPaid(orderNumber);
      if (updated) {
        setOrder(updated);
        router.push(`/orders/${updated.orderNumber}`);
      }
    }, 900);
  }

  async function copyAccount() {
    await navigator.clipboard.writeText("880026202608");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className="section shell payment-shell">
      <div className="payment-heading"><span className="status-pill status-pill--pending"><Clock3 size={15} /> Menunggu pembayaran</span><h1>Selesaikan pembayaran pesanan</h1><p>Nomor pesanan <strong>{order.orderNumber}</strong> · dibuat {formatDateTime(order.createdAt)}</p></div>
      <div className="payment-layout">
        <div className="payment-card">
          {order.paymentMethod === "qris" ? <div className="qris-panel"><QrCode size={30} /><span>QRIS SAMPLE</span><div className="fake-qr" aria-label="QRIS sample">{Array.from({ length: 49 }, (_, index) => <i key={index} className={index % 3 === 0 || index % 7 === 0 ? "filled" : ""} />)}</div><p>Pindai kode sample menggunakan aplikasi pembayaran.</p></div> : <div className="bank-panel"><div className="bank-logo"><CreditCard size={22} /> BERKAH BANK</div><span>Nomor virtual account</span><div className="account-number"><strong>8800 2620 2608</strong><button onClick={copyAccount}><Clipboard size={16} /> {copied ? "Tersalin" : "Salin"}</button></div><p>Gunakan nomor ini untuk simulasi transfer. Tidak ada transaksi bank nyata.</p></div>}
          <div className="payment-total"><span>Total yang harus dibayar</span><strong>{formatCurrency(order.grandTotal)}</strong></div>
          <button className="button button--primary full-width" onClick={completePayment} disabled={processing}>{processing ? "Memverifikasi pembayaran..." : "Simulasikan pembayaran berhasil"}</button>
          <div className="secure-note"><ShieldCheck size={18} /><span>Pada versi produksi, status pembayaran hanya akan berubah melalui webhook payment gateway yang tervalidasi.</span></div>
        </div>
        <aside className="order-mini-card"><h2>Detail pesanan</h2>{order.items.map((line) => <article key={line.product.id}><img src={line.product.image} alt="" /><div><strong>{line.product.shortName}</strong><span>{line.quantity} barang</span></div><b>{formatCurrency(line.subtotal)}</b></article>)}<div><span>Pengiriman</span><strong>{order.shipping.courier} {order.shipping.service}</strong></div><div><span>Tujuan</span><strong>{order.customer.city}</strong></div><div><span>Nomor resi</span><strong>{order.trackingNumber}</strong></div></aside>
      </div>
    </section>
  );
}
