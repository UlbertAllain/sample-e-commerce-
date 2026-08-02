import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <section className="shell empty-state"><span className="eyebrow">404</span><h1>Halaman tidak ditemukan</h1><p>Konten yang Anda cari tidak tersedia.</p><Button href="/">Kembali ke beranda</Button></section>;
}
