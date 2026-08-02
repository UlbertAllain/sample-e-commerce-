import { products } from "@/data/products";
import { shippingServices } from "@/data/shipping";
import type { Order } from "@/types/commerce";

const product = products[1];

export const demoOrder: Order = {
  id: "demo-order",
  orderNumber: "BO-DEMO-2026",
  trackingNumber: "RESI-DEMO-2026",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  customer: {
    fullName: "Pelanggan Demo",
    phone: "0812-0000-2026",
    email: "demo@berkahoyot.com",
    province: "Jawa Tengah",
    city: "Sukoharjo",
    district: "Polokarto",
    postalCode: "57555",
    address: "Jl. Contoh No. 26, Sukoharjo",
  },
  items: [
    {
      product,
      quantity: 1,
      unitPrice: product.price,
      subtotal: product.price,
    },
  ],
  shipping: shippingServices[0],
  paymentMethod: "bank-transfer",
  paymentStatus: "paid",
  shipmentStatus: "in-transit",
  subtotal: product.price,
  discount: 10000,
  shippingCost: shippingServices[0].price,
  grandTotal: product.price - 10000 + shippingServices[0].price,
  voucherCode: "AQUA10",
  timeline: [
    {
      status: "waiting-payment",
      label: "Menunggu pembayaran",
      description: "Pesanan dibuat.",
      completed: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      status: "processing",
      label: "Pesanan diproses",
      description: "Pembayaran terverifikasi dan barang disiapkan.",
      completed: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      status: "packed",
      label: "Pesanan dikemas",
      description: "Paket selesai dikemas.",
      completed: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
    },
    {
      status: "picked-up",
      label: "Diserahkan ke kurir",
      description: "Paket diterima oleh JNE REG.",
      completed: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      status: "in-transit",
      label: "Dalam perjalanan",
      description: "Paket menuju kota penerima.",
      completed: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      status: "delivered",
      label: "Pesanan diterima",
      description: "Paket belum diterima.",
      completed: false,
    },
  ],
};
