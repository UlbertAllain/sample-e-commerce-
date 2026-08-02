import type { Category } from "@/types/commerce";

export const categories: Category[] = [
  { id: "filter", name: "Filter", description: "Media dan sistem filtrasi untuk air tetap jernih.", icon: "◫", isActive: true, order: 1 },
  { id: "machine", name: "Mesin", description: "Pompa, aerator, dan perlengkapan sirkulasi air.", icon: "◉", isActive: true, order: 2 },
  { id: "lighting", name: "Lampu", description: "Pencahayaan akuarium untuk warna dan pertumbuhan.", icon: "✦", isActive: true, order: 3 },
  { id: "pipe-sparepart", name: "Pipa & Sparepart", description: "Fitting, valve, selang, dan komponen instalasi.", icon: "⌁", isActive: true, order: 4 },
  { id: "decoration", name: "Dekorasi", description: "Elemen visual untuk membuat akuarium lebih hidup.", icon: "◇", isActive: true, order: 5 },
  { id: "food-medicine", name: "Pakan & Obat", description: "Kebutuhan nutrisi dan perawatan ikan harian.", icon: "●", isActive: true, order: 6 },
];
