"use client";

import {
  Check,
  Download,
  FileText,
  PackageCheck,
  Printer,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import {
  downloadShippingLabelPng,
  printShippingLabelPdf,
} from "@/features/orders/shipping-label-image";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { Order } from "@/types/commerce";

export function OrderClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<Order | null>();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<Order>(`/api/store/orders/${encodeURIComponent(orderNumber)}`)
      .then((nextOrder) => {
        if (active) setOrder(nextOrder);
      })
      .catch((caught) => {
        if (!active) return;
        setError(caught instanceof ApiClientError ? caught.message : "Pesanan tidak dapat dimuat.");
        setOrder(null);
      });
    return () => {
      active = false;
    };
  }, [orderNumber]);

  if (order === undefined) {
    return <div className="shell loading-state">Memuat pesanan...</div>;
  }

  if (!order) {
    return (
      <section className="shell empty-state">
        <PackageCheck size={46} />
        <h1>Pesanan tidak ditemukan</h1>
        <p>{error || "Pesanan tidak tersedia atau bukan milik akun ini."}</p>
        <Button href="/tracking">Buka tracking</Button>
      </section>
    );
  }

  function printInvoice() {
    document.body.dataset.printPart = "invoice";

    const cleanup = () => {
      delete document.body.dataset.printPart;
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, 1500);
  }

  return (
    <section className="section shell order-page">
      <div className="order-success no-print">
        <div className="order-success__icon">
          <Check size={26} />
        </div>
        <div>
          <span className="section-kicker">PESANAN TERCATAT</span>
          <h1>
            {order.paymentMethod === "cod"
              ? "Pesanan COD siap diproses."
              : order.paymentStatus === "paid"
                ? "Pembayaran telah dikonfirmasi."
                : "Pesanan menunggu pembayaran."}
          </h1>
          <p>
            Nomor pesanan <strong>{order.orderNumber}</strong>
          </p>
        </div>
      </div>

      <div className="order-actions no-print">
        <Button href="/catalog" variant="secondary">
          Belanja lagi
        </Button>
        <button
          className="button button--secondary"
          onClick={printInvoice}
        >
          <FileText size={17} /> Cetak invoice
        </button>
        <button
          className="button button--secondary"
          onClick={() => printShippingLabelPdf(order)}
        >
          <Printer size={17} /> Cetak / simpan PDF resi
        </button>
        <button
          className="button button--primary"
          onClick={() => downloadShippingLabelPng(order)}
        >
          <Download size={17} /> Unduh resi PNG
        </button>
      </div>

      <div className="order-layout">
        <div>
          <section className="order-card tracking-card no-print">
            <div className="order-card__heading">
              <div>
                <span className="section-kicker">STATUS PENGIRIMAN</span>
                <h2>
                  {order.shipping.courier} · {order.shipping.service}
                </h2>
              </div>
              <span className="status-pill">
                {order.shipmentStatus.replaceAll("-", " ")}
              </span>
            </div>

            <div className="tracking-number">
              <span>Nomor resi</span>
              <strong>{order.trackingNumber}</strong>
            </div>

            <div className="timeline">
              {order.timeline.map((item) => (
                <article
                  key={item.status}
                  className={item.completed ? "completed" : ""}
                >
                  <div className="timeline__dot">
                    {item.completed && <Check size={13} />}
                  </div>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                    {item.timestamp && <time>{formatDateTime(item.timestamp)}</time>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="order-card print-invoice" id="print-invoice">
            <div className="invoice-brand">
              <img src="/brand/logo-mark.svg" alt="" />
              <div>
                <strong>{order.sender.storeName.toUpperCase()}</strong>
                <span>Invoice {order.orderNumber}</span>
              </div>
            </div>

            <div className="invoice-meta">
              <div>
                <span>DITAGIHKAN KEPADA</span>
                <strong>{order.customer.fullName}</strong>
                <p>
                  {order.customer.address}, {order.customer.district},{" "}
                  {order.customer.city}, {order.customer.province}{" "}
                  {order.customer.postalCode}
                </p>
                <p>{order.customer.phone}</p>
              </div>
              <div>
                <span>TANGGAL</span>
                <strong>{formatDateTime(order.createdAt)}</strong>
                <span>STATUS PEMBAYARAN</span>
                <strong>{order.paymentStatus.toUpperCase()}</strong>
              </div>
            </div>

            <div className="invoice-table">
              <div className="invoice-row invoice-row--head">
                <span>Produk</span>
                <span>Qty</span>
                <span>Harga</span>
                <span>Subtotal</span>
              </div>
              {order.items.map((line) => (
                <div className="invoice-row" key={`${line.product.id}-${line.variant?.id ?? "default"}`}>
                  <span>
                    {line.product.shortName}{line.variant ? ` · ${line.variant.name}` : ""}
                    <small>{line.variant?.sku ?? line.product.sku}</small>
                  </span>
                  <span>{line.quantity}</span>
                  <span>{formatCurrency(line.unitPrice)}</span>
                  <span>{formatCurrency(line.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="invoice-totals">
              <div>
                <span>Subtotal</span>
                <strong>{formatCurrency(order.subtotal)}</strong>
              </div>
              <div>
                <span>Diskon</span>
                <strong>-{formatCurrency(order.discount)}</strong>
              </div>
              <div>
                <span>Ongkir</span>
                <strong>{formatCurrency(order.shippingCost)}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(order.grandTotal)}</strong>
              </div>
            </div>
          </section>
        </div>

        <aside className="shipping-label order-card" id="shipping-label">
          <div className="label-header">
            <div>
              <strong>{order.sender.storeName.toUpperCase()}</strong>
              <span>SHIPPING LABEL</span>
            </div>
            <b>{order.shipping.courier}</b>
          </div>

          <div className="label-route">
            <div>
              <span>FROM</span>
              <strong>{order.sender.storeName.toUpperCase()}</strong>
              <p>
                {order.sender.address}
                <br />
                {order.sender.phone}
              </p>
            </div>
            <div>
              <span>TO</span>
              <strong>{order.customer.fullName}</strong>
              <p>
                {order.customer.address}
                <br />
                {order.customer.district}, {order.customer.city},{" "}
                {order.customer.province} {order.customer.postalCode}
                <br />
                {order.customer.phone}
              </p>
            </div>
          </div>

          <div className="label-service">
            <strong>{order.shipping.courier}</strong>
            <span>{order.shipping.service}</span>
          </div>

          <div className="barcode" aria-hidden="true">
            {Array.from({ length: 38 }, (_, index) => (
              <i key={index} style={{ width: index % 4 === 0 ? 4 : 2 }} />
            ))}
          </div>
          <strong className="label-resi">{order.trackingNumber}</strong>

          <div className="label-order">
            <span>ORDER</span>
            <strong>{order.orderNumber}</strong>
          </div>
          <div className="label-warning">
            JANGAN DIBANTING · PERIKSA KONDISI PAKET
          </div>
        </aside>
      </div>
    </section>
  );
}
