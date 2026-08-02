# Berkah Oyot Storefront Sample

Storefront e-commerce statis untuk demonstrasi client Berkah Oyot. Proyek dibangun dengan Next.js App Router dan TypeScript. Seluruh data sample berjalan melalui mock data serta `localStorage`, sehingga demo dapat digunakan tanpa Firebase, Cloudinary, payment gateway, atau API kurir.

## Perubahan versi ini

- Desain storefront dirombak menjadi editorial commerce yang lebih profesional, tegas, dan tidak menggunakan pola UI generik penuh kartu/pill.
- Ditambahkan akun pelanggan: register, login, logout, profil, alamat utama, dan riwayat transaksi.
- Data penerima hanya diisi saat pendaftaran. Checkout otomatis mengambil nama, email, WhatsApp, dan alamat dari profil pelanggan.
- Data profil dapat diperbarui melalui halaman **Akun Saya**.
- Shipping label dapat dicetak atau disimpan sebagai PDF melalui dialog print browser.
- Shipping label dapat langsung diunduh dalam format PNG tanpa dependency tambahan.

## Cakupan sample

- Homepage responsif dengan branding Berkah Oyot
- Katalog, pencarian, filter kategori, dan pengurutan
- Detail produk, harga grosir otomatis, dan produk terkait
- Keranjang persisten di `localStorage`
- Register pelanggan dengan identitas dan alamat lengkap
- Login dan session pelanggan lokal
- Profil pelanggan dan alamat utama
- Checkout berbasis profil pelanggan
- Voucher, pilihan kurir, dan metode pembayaran
- Simulasi pembayaran transfer bank atau QRIS
- Pilihan COD
- Pembuatan nomor pesanan dan resi secara lokal
- Timeline pengiriman yang dapat dimajukan untuk demo
- Tracking berdasarkan nomor pesanan atau resi
- Invoice yang dapat dicetak
- Resi yang dapat dicetak, disimpan sebagai PDF, atau diunduh sebagai PNG
- Adapter awal untuk Firebase Firestore dan Cloudinary

## Menjalankan proyek

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Alur demo yang disarankan

1. Buka `/register` dan buat akun pelanggan dengan data lengkap.
2. Buka `/catalog`, lalu tambahkan satu atau beberapa produk.
3. Buka `/cart`, lalu lanjut ke `/checkout`.
4. Pastikan checkout langsung menampilkan alamat dari profil tanpa form data diri.
5. Gunakan voucher `AQUA10`.
6. Pilih kurir dan metode pembayaran.
7. Untuk transfer atau QRIS, klik **Simulasikan pembayaran berhasil**.
8. Pada detail pesanan, gunakan:
   - **Cetak invoice**
   - **Cetak / simpan PDF resi**
   - **Unduh resi PNG**
   - **Majukan status** untuk mendemokan perjalanan paket

Tracking siap pakai tanpa checkout:

```text
RESI-DEMO-2026
```

## Route penting

```text
/                 Homepage
/catalog          Katalog produk
/cart             Keranjang
/register         Pendaftaran pelanggan + alamat utama
/login            Login pelanggan
/account          Profil, alamat, dan riwayat pesanan
/checkout         Checkout berbasis profil
/tracking         Pelacakan resi
```

## Struktur utama

```text
src/
├── app/                    # Halaman dan route Next.js
├── components/             # Komponen layout, store, dan UI
├── context/                # State keranjang dan session pelanggan
├── data/                   # Produk, kategori, kurir, order demo
├── features/auth/          # Register, login, profil, localStorage
├── features/orders/        # Order, tracking, invoice, resi PNG
├── infrastructure/         # Scaffold Firebase dan Cloudinary
├── repositories/           # Contract dan mock repository
├── lib/                    # Formatter/helper
└── types/                  # Model domain commerce dan auth
```

## Catatan keamanan sample

Akun dan password sample disimpan di `localStorage` agar alur demo dapat berjalan tanpa backend. Mekanisme ini **tidak boleh digunakan pada produksi**. Versi produksi harus menggunakan Firebase Authentication, session server, validasi role server-side, serta Firestore Security Rules.

## Firebase dan Cloudinary

Sample ini sengaja tidak membaca atau menulis data backend. Isi `.env.local` berdasarkan `.env.example` saat memasuki fase integrasi produksi. Adapter awal berada di:

```text
src/infrastructure/firebase/client.ts
src/infrastructure/cloudinary/config.ts
```

Strategi migrasi dijelaskan di [`docs/MIGRATION_TO_PRODUCTION.md`](docs/MIGRATION_TO_PRODUCTION.md).

## Catatan aset

Gambar produk adalah aset ilustrasi lokal untuk kebutuhan sample. Pada fase produksi, gambar diganti dengan foto produk asli melalui Cloudinary.
