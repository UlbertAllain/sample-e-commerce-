import type { ProductCategory } from "@/types/commerce";

export type Category = {
  id: ProductCategory;
  name: string;
  description: string;
  icon: string;
};

export const categories: Category[] = [
  {
    id: "filter",
    name: "Filter",
    description: "Media dan sistem filtrasi untuk air tetap jernih.",
    icon: "◫",
  },
  {
    id: "machine",
    name: "Mesin",
    description: "Pompa, aerator, dan perlengkapan sirkulasi air.",
    icon: "◉",
  },
  {
    id: "lighting",
    name: "Lampu",
    description: "Pencahayaan akuarium untuk warna dan pertumbuhan.",
    icon: "✦",
  },
  {
    id: "pipe-sparepart",
    name: "Pipa & Sparepart",
    description: "Fitting, valve, selang, dan komponen instalasi.",
    icon: "⌁",
  },
  {
    id: "decoration",
    name: "Dekorasi",
    description: "Elemen visual untuk membuat akuarium lebih hidup.",
    icon: "◇",
  },
  {
    id: "food-medicine",
    name: "Pakan & Obat",
    description: "Kebutuhan nutrisi dan perawatan ikan harian.",
    icon: "●",
  },
];
