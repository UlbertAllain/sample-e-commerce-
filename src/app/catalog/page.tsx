import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogClient } from "./catalog-client";

export const metadata: Metadata = {
  title: "Katalog Produk",
};

function CatalogFallback() {
  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <span className="eyebrow eyebrow--light">Koleksi lengkap</span>

          <h1>Katalog perlengkapan akuarium</h1>

          <p>Menyiapkan produk...</p>
        </div>
      </section>

      <section className="section shell">
        <div className="loading-state">Memuat katalog...</div>
      </section>
    </>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogClient />
    </Suspense>
  );
}
