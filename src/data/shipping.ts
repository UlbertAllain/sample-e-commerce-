import type { ShippingService } from "@/types/commerce";

export const shippingServices: ShippingService[] = [
  {
    id: "jne-reg",
    courier: "JNE",
    service: "REG",
    eta: "2–4 hari",
    price: 18000,
    description: "Pilihan reguler dengan jangkauan luas.",
  },
  {
    id: "jnt-ez",
    courier: "J&T Express",
    service: "EZ",
    eta: "2–3 hari",
    price: 20000,
    description: "Pengiriman cepat untuk area kota besar.",
  },
  {
    id: "sicepat-best",
    courier: "SiCepat",
    service: "BEST",
    eta: "1–2 hari",
    price: 29000,
    description: "Layanan prioritas untuk kebutuhan mendesak.",
  },
  {
    id: "store-pickup",
    courier: "Berkah Oyot",
    service: "Ambil di Toko",
    eta: "Siap ±2 jam",
    price: 0,
    description: "Ambil langsung di toko setelah pesanan dikonfirmasi.",
  },
];
