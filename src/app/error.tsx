"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront runtime error", error);
  }, [error]);

  return (
    <section className="shell empty-state">
      <span className="eyebrow">TERJADI KESALAHAN</span>
      <h1>Halaman belum dapat ditampilkan.</h1>
      <p>Silakan muat ulang halaman. Jika masalah tetap terjadi, periksa log deployment Vercel.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Button type="button" onClick={reset}>Coba lagi</Button>
        <Button href="/" variant="secondary">Kembali ke beranda</Button>
      </div>
    </section>
  );
}
