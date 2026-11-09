# Berkah Oyot — Aquarium Store Sample

Sample aplikasi toko perlengkapan akuarium dengan katalog produk, checkout pelanggan, serta panel admin. Repository telah berkembang dari demo berbasis localStorage menjadi implementasi yang memakai Firebase Authentication, Firestore server-side, dan Cloudinary. Catatan tentang prototipe lama disimpan di `docs/` agar tidak tercampur dengan petunjuk versi aktif.

## Cakupan saat ini

- Katalog dan halaman produk, kategori, keranjang, serta akun pelanggan.
- Checkout berbasis server dengan validasi ulang harga dan stok.
- Session HTTP-only dan role admin.
- Dashboard admin untuk produk, kategori, pesanan, stok, dan pengaturan.
- Riwayat pesanan, invoice, resi, dan export/print.

Implementasi layanan eksternal tertentu **masih disimulasikan**: payment gateway dan webhook, ongkir live, penerbitan resi kurir, pickup, tracking otomatis, dan refund. Lihat [backend scope](docs/BACKEND_SCOPE.md) sebelum integrasi nyata.

## Teknologi

Next.js 16, React 19, TypeScript, Firebase Authentication, Firebase Admin SDK, Firestore, Cloudinary, Zod, dan ESLint.

## Setup lokal

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Di Windows PowerShell gunakan `Copy-Item .env.example .env.local`. Konfigurasikan Firebase project, credential server, serta Cloudinary sesuai kebutuhan. **Jangan commit** `.env.local`, service-account JSON, atau key server.

Bootstrap admin disediakan lewat `npm run admin:create`. Jalankan hanya pada Firebase project yang telah disiapkan dan ikuti [panduan migrasi backend](docs/BACKEND_MIGRATION.md) sebelum mengubah database.

## Struktur

```text
src/app/                Routes publik, akun, admin, dan API
src/context/            State auth, catalog, dan store
src/config/             Konfigurasi environment
src/data/               Aset data contoh
src/types/              Model commerce dan auth
scripts/create-admin.mjs Admin bootstrap
firestore.rules         Aturan akses Firestore
docs/                   Scope backend, migrasi, dan audit
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

**Status:** Sample integrasi, bukan toko production-ready. Uji ulang otorisasi server, pembayaran, persediaan, dan alur fulfillment sebelum penggunaan komersial.
