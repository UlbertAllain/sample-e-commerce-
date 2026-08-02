"use client";

import { Clipboard, Clock3, CreditCard, QrCode, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { Order, StoreSettings } from "@/types/commerce";

type PublicSettings = Pick<
  StoreSettings,
  "bankName" | "bankAccountName" | "bankAccountNumber" | "qrisImageUrl"
>;

export function PaymentClient({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>();
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<Order>(`/api/store/orders/${encodeURIComponent(orderNumber)}`),
      apiFetch<PublicSettings>("/api/store/settings"),
    ])
      .then(([nextOrder, nextSettings]) => {
        if (!active) return;
        setOrder(nextOrder);
        setSettings(nextSettings);
      })
      .catch((caught) => {
        if (!active) return;
        setOrder(null);
        setError(caught instanceof ApiClientError ? caught.message : "Pembayaran tidak dapat dimuat.");
      });
    return () => {
      active = false;
    };
  }, [orderNumber]);

  if (order === undefined) return <div className="shell loading-state">Memuat pembayaran...</div>;
  if (!order) {
    return (
      <section className="shell empty-state">
        <h1>Pesanan tidak ditemukan</h1>
        <p>{error || "Pesanan tidak tersedia atau bukan milik akun ini."}</p>
        <Button href="/account">Buka akun</Button>
      </section>
    );
  }

  async function completePayment() {
    setProcessing(true);
    setError("");
    try {
      const updated = await apiFetch<Order>(`/api/store/orders/${encodeURIComponent(orderNumber)}/payment`, {
        method: "POST",
      });
      setOrder(updated);
      router.push(`/orders/${updated.orderNumber}`);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Pembayaran gagal diperbarui.");
      setProcessing(false);
    }
  }

  async function copyAccount() {
    const number = settings?.bankAccountNumber || "-";
    await navigator.clipboard.writeText(number);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className="section shell payment-shell">
      <div className="payment-heading">
        <span className="status-pill status-pill--pending"><Clock3 size={15} /> Menunggu pembayaran</span>
        <h1>Selesaikan pembayaran pesanan</h1>
        <p>Nomor pesanan <strong>{order.orderNumber}</strong> · dibuat {formatDateTime(order.createdAt)}</p>
      </div>
      <div className="payment-layout">
        <div className="payment-card">
          {order.paymentMethod === "qris" ? (
            <div className="qris-panel">
              <QrCode size={30} />
              <span>QRIS</span>
              {settings?.qrisImageUrl ? (
                <img className="qris-image" src={settings.qrisImageUrl} alt="QRIS Berkah Oyot" />
              ) : (
                <div className="fake-qr" aria-label="QRIS sample">
                  {Array.from({ length: 49 }, (_, index) => <i key={index} className={index % 3 === 0 || index % 7 === 0 ? "filled" : ""} />)}
                </div>
              )}
              <p>Pindai QRIS kemudian gunakan tombol konfirmasi untuk simulasi backend.</p>
            </div>
          ) : (
            <div className="bank-panel">
              <div className="bank-logo"><CreditCard size={22} /> {settings?.bankName || "BANK TRANSFER"}</div>
              <span>Nomor rekening</span>
              <div className="account-number">
                <strong>{settings?.bankAccountNumber || "Belum diatur"}</strong>
                <button onClick={copyAccount} disabled={!settings?.bankAccountNumber}><Clipboard size={16} /> {copied ? "Tersalin" : "Salin"}</button>
              </div>
              <p>Atas nama {settings?.bankAccountName || "Berkah Oyot"}.</p>
            </div>
          )}
          <div className="payment-total"><span>Total yang harus dibayar</span><strong>{formatCurrency(order.grandTotal)}</strong></div>
          {error && <div className="form-error">{error}</div>}
          <button className="button button--primary full-width" onClick={completePayment} disabled={processing || order.paymentStatus === "paid"}>
            {order.paymentStatus === "paid" ? "Pembayaran sudah dikonfirmasi" : processing ? "Memverifikasi pembayaran..." : "Simulasikan pembayaran berhasil"}
          </button>
          <div className="secure-note"><ShieldCheck size={18} /><span>Simulasi ini memperbarui status melalui endpoint server. Payment gateway produksi tetap perlu webhook terverifikasi.</span></div>
        </div>
        <aside className="order-mini-card">
          <h2>Detail pesanan</h2>
          {order.items.map((line) => <article key={`${line.product.id}-${line.variant?.id ?? "default"}`}><img src={line.product.image} alt="" /><div><strong>{line.product.shortName}{line.variant ? ` · ${line.variant.name}` : ""}</strong><span>{line.quantity} barang</span></div><b>{formatCurrency(line.subtotal)}</b></article>)}
          <div><span>Pengiriman</span><strong>{order.shipping.courier} {order.shipping.service}</strong></div>
          <div><span>Tujuan</span><strong>{order.customer.city}</strong></div>
          <div><span>Nomor resi</span><strong>{order.trackingNumber}</strong></div>
        </aside>
      </div>
    </section>
  );
}
