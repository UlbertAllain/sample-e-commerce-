"use client";

import { Download, FileText, Printer, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { downloadShippingLabelPng, printShippingLabelPdf } from "@/features/orders/shipping-label-image";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { Order, PaymentStatus, ShipmentStatus } from "@/types/commerce";

export function AdminOrderDetailClient({ identifier }: { identifier: string }) {
  const [order, setOrder] = useState<Order | null>();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [shipmentStatus, setShipmentStatus] = useState<ShipmentStatus>("waiting-payment");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    void apiFetch<Order>(`/api/admin/orders/${encodeURIComponent(identifier)}`)
      .then((result) => {
        if (cancelled) return;
        setOrder(result);
        setPaymentStatus(result.paymentStatus);
        setShipmentStatus(result.shipmentStatus);
        setTrackingNumber(result.trackingNumber);
        setInternalNote(result.internalNote ?? "");
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setOrder(null);
        setMessage(caught instanceof Error ? caught.message : "Pesanan gagal dimuat.");
      });

    return () => {
      cancelled = true;
    };
  }, [identifier]);

  async function save() {
    if (shipmentStatus === "cancelled" && order?.shipmentStatus !== "cancelled" && !window.confirm("Membatalkan pesanan akan mengembalikan stok. Lanjutkan?")) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await apiFetch<Order>(`/api/admin/orders/${encodeURIComponent(identifier)}`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus, shipmentStatus, trackingNumber, internalNote }),
      });
      setOrder(updated);
      setMessage("Pesanan berhasil diperbarui.");
    } catch (caught) {
      setMessage(caught instanceof ApiClientError ? caught.message : "Pesanan gagal diperbarui.");
    } finally { setSaving(false); }
  }

  function printInvoice() {
    document.body.dataset.printPart = "invoice";
    const cleanup = () => { delete document.body.dataset.printPart; window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, 1500);
  }

  if (order === undefined) return <div className="admin-loading">Memuat pesanan...</div>;
  if (!order) return <div className="admin-error">{message || "Pesanan tidak ditemukan."}</div>;

  return (
    <>
      <div className="admin-page-heading"><div><span>DETAIL PESANAN</span><h1>{order.orderNumber}</h1><p>Dibuat {formatDateTime(order.createdAt)} · {order.customer.fullName}</p></div><div className="admin-heading-actions"><button className="button button--secondary" onClick={printInvoice}><FileText size={17} /> Invoice</button><button className="button button--secondary" onClick={() => printShippingLabelPdf(order)}><Printer size={17} /> PDF resi</button><button className="button button--primary" onClick={() => downloadShippingLabelPng(order)}><Download size={17} /> PNG resi</button></div></div>
      {message && <div className="admin-notice">{message}</div>}
      <div className="admin-order-grid">
        <div className="admin-panel">
          <div className="admin-panel__heading"><div><span>ITEM PESANAN</span><h2>{order.items.reduce((total, item) => total + item.quantity, 0)} barang</h2></div></div>
          <div className="admin-order-items">{order.items.map((line) => <article key={`${line.product.id}-${line.variant?.id ?? "default"}`}><img src={line.product.image} alt="" /><div><strong>{line.product.shortName}{line.variant ? ` · ${line.variant.name}` : ""}</strong><span>{line.variant?.sku ?? line.product.sku} · {line.quantity} × {formatCurrency(line.unitPrice)}</span></div><b>{formatCurrency(line.subtotal)}</b></article>)}</div>
          <div className="admin-order-totals"><div><span>Subtotal</span><strong>{formatCurrency(order.subtotal)}</strong></div><div><span>Diskon</span><strong>-{formatCurrency(order.discount)}</strong></div><div><span>Pengiriman</span><strong>{formatCurrency(order.shippingCost)}</strong></div><div><span>Total</span><strong>{formatCurrency(order.grandTotal)}</strong></div></div>
        </div>

        <div className="admin-panel admin-order-control">
          <div className="admin-panel__heading"><div><span>PROSES PESANAN</span><h2>Status dan pengiriman</h2></div></div>
          <label>Status pembayaran<select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="expired">Expired</option><option value="refunded">Refunded</option></select></label>
          <label>Status pengiriman<select value={shipmentStatus} onChange={(event) => setShipmentStatus(event.target.value as ShipmentStatus)}><option value="waiting-payment">Menunggu pembayaran</option><option value="processing">Diproses</option><option value="packed">Dikemas</option><option value="picked-up">Diserahkan ke kurir</option><option value="in-transit">Dalam perjalanan</option><option value="delivered">Diterima</option><option value="cancelled">Dibatalkan</option></select></label>
          <label>Nomor resi<input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} /></label>
          <label>Catatan internal<textarea rows={5} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} /></label>
          <button className="button button--primary full-width" onClick={save} disabled={saving}><Save size={17} /> {saving ? "Menyimpan..." : "Perbarui pesanan"}</button>
        </div>
      </div>

      <div className="admin-order-grid admin-order-grid--bottom">
        <section className="admin-panel"><div className="admin-panel__heading"><div><span>PELANGGAN</span><h2>Alamat penerima</h2></div></div><div className="admin-address"><strong>{order.customer.fullName}</strong><span>{order.customer.email} · {order.customer.phone}</span><p>{order.customer.address}, {order.customer.district}, {order.customer.city}, {order.customer.province} {order.customer.postalCode}</p>{order.customer.note && <em>Catatan: {order.customer.note}</em>}</div></section>
        <section className="admin-panel"><div className="admin-panel__heading"><div><span>PENGIRIMAN</span><h2>{order.shipping.courier} {order.shipping.service}</h2></div></div><div className="admin-address"><strong>{order.trackingNumber}</strong><span>Estimasi {order.shipping.eta}</span><p>{order.shipping.description}</p></div></section>
      </div>

      <section className="order-card print-invoice admin-print-invoice" id="print-invoice">
        <div className="invoice-brand"><img src="/brand/logo-mark.svg" alt="" /><div><strong>{order.sender.storeName.toUpperCase()}</strong><span>Invoice {order.orderNumber}</span></div></div>
        <div className="invoice-meta"><div><span>DITAGIHKAN KEPADA</span><strong>{order.customer.fullName}</strong><p>{order.customer.address}, {order.customer.district}, {order.customer.city}, {order.customer.province} {order.customer.postalCode}</p><p>{order.customer.phone}</p></div><div><span>TANGGAL</span><strong>{formatDateTime(order.createdAt)}</strong><span>STATUS PEMBAYARAN</span><strong>{order.paymentStatus.toUpperCase()}</strong></div></div>
        <div className="invoice-table"><div className="invoice-row invoice-row--head"><span>Produk</span><span>Qty</span><span>Harga</span><span>Subtotal</span></div>{order.items.map((line) => <div className="invoice-row" key={`${line.product.id}-${line.variant?.id ?? "default"}`}><span>{line.product.shortName}{line.variant ? ` · ${line.variant.name}` : ""}<small>{line.variant?.sku ?? line.product.sku}</small></span><span>{line.quantity}</span><span>{formatCurrency(line.unitPrice)}</span><span>{formatCurrency(line.subtotal)}</span></div>)}</div>
        <div className="invoice-totals"><div><span>Subtotal</span><strong>{formatCurrency(order.subtotal)}</strong></div><div><span>Diskon</span><strong>-{formatCurrency(order.discount)}</strong></div><div><span>Ongkir</span><strong>{formatCurrency(order.shippingCost)}</strong></div><div><span>Total</span><strong>{formatCurrency(order.grandTotal)}</strong></div></div>
      </section>
    </>
  );
}
